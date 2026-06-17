"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { sendSms } from "@/lib/sms";
import { encryptSensitive } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";

export type KycFormState =
  | { error?: string; otp?: string; sent?: boolean; verified?: boolean }
  | undefined;

const requestSchema = z.object({
  cin: z.string().trim().regex(/^[0-9]{8}$/),
  phone: z.string().trim().regex(/^\+?[0-9\s]{8,16}$/),
});

export async function requestKycOtpAction(
  _prev: KycFormState,
  formData: FormData
): Promise<KycFormState> {
  const fr = await getT();
  const user = await requireUser();
  if (user.kycStatus === "VERIFIE") return { verified: true };

  if (!(await assertRateLimit("otp"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = requestSchema.safeParse({
    cin: formData.get("cin"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  // CIN chiffrée au repos si KYC_ENC_KEY est défini (sinon clair, cf. crypto.ts).
  await prisma.user.update({
    where: { id: user.id },
    data: {
      cin: encryptSensitive(parsed.data.cin),
      phone: parsed.data.phone,
      kycStatus: "EN_ATTENTE",
    },
  });

  const code = await issueOtp(user.id);
  const sent = await sendSms(
    parsed.data.phone,
    `Darna : votre code de vérification est ${code}`
  );

  await logAudit({ action: "KYC_OTP_REQUESTED", userId: user.id, success: true });
  revalidatePath("/dashboard/kyc");

  // Mode dev/démo (aucun provider SMS) : on renvoie le code pour l'afficher.
  // Mode prod (SMS envoyé) : on signale juste `sent` sans exposer le code.
  return sent ? { sent: true } : { sent: true, otp: code };
}

const verifySchema = z.object({
  otp: z.string().trim().regex(/^[0-9]{6}$/),
});

export async function verifyKycOtpAction(
  _prev: KycFormState,
  formData: FormData
): Promise<KycFormState> {
  const fr = await getT();
  const user = await requireUser();
  if (user.kycStatus === "VERIFIE") return { verified: true };

  if (!(await assertRateLimit("otp-verif"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = verifySchema.safeParse({ otp: formData.get("otp") });
  if (!parsed.success) return { error: fr.kyc.otpInvalide };

  if (!(await verifyOtp(user.id, parsed.data.otp))) {
    return { error: fr.kyc.otpInvalide };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { kycStatus: "VERIFIE", phoneVerified: true },
  });

  await logAudit({ action: "KYC_VERIFIED", userId: user.id, success: true });
  revalidatePath("/dashboard");
  return { verified: true };
}
