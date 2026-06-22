"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { sendOtp } from "@/lib/otp-channel";
import { encryptSensitive } from "@/lib/crypto";
import { kycMode } from "@/lib/modes";
import { logAudit } from "@/lib/audit";

export type KycFormState =
  | { error?: string; otp?: string; sent?: boolean; verified?: boolean; demo?: boolean }
  | undefined;

/** Statuts considérés comme « déjà vérifié » (réel OU démo) — pas de re-vérif. */
function isAlreadyVerified(status: string): boolean {
  return status === "VERIFIE" || status === "DEMO_VERIFIE";
}

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
  if (isAlreadyVerified(user.kycStatus)) {
    return { verified: true, demo: user.kycStatus === "DEMO_VERIFIE" };
  }

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

  const code = await issueOtp(user.id, "KYC");
  // PR4 : délègue à sendOtp (SMS ou WhatsApp selon OTP_PROVIDER).
  const sent = await sendOtp(parsed.data.phone, code);

  await logAudit({ action: "KYC_OTP_REQUESTED", userId: user.id, success: true });
  revalidatePath("/dashboard/kyc");

  // Le code n'est renvoyé au client QU'EN MODE DÉMO (sendOtp n'a rien envoyé).
  // En production, sendOtp a réellement envoyé le message (ou levé) → on ne
  // renvoie JAMAIS le code, on signale seulement `sent`.
  return kycMode() === "demo" && !sent ? { sent: true, otp: code } : { sent: true };
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
  if (isAlreadyVerified(user.kycStatus)) {
    return { verified: true, demo: user.kycStatus === "DEMO_VERIFIE" };
  }

  if (!(await assertRateLimit("otp-verif"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = verifySchema.safeParse({ otp: formData.get("otp") });
  if (!parsed.success) return { error: fr.kyc.otpInvalide };

  if (!(await verifyOtp(user.id, parsed.data.otp))) {
    return { error: fr.kyc.otpInvalide };
  }

  // DÉMO : statut DEMO_VERIFIE — un OTP affiché à l'écran ne prouve PAS l'identité,
  // on ne décerne donc jamais le vrai badge VERIFIE. PRODUCTION : VERIFIE, atteint
  // uniquement après un OTP réellement reçu par SMS (cf. sendSms / env.ts).
  const demo = kycMode() === "demo";
  await prisma.user.update({
    where: { id: user.id },
    data: { kycStatus: demo ? "DEMO_VERIFIE" : "VERIFIE", phoneVerified: !demo },
  });

  await logAudit({
    action: "KYC_VERIFIED",
    userId: user.id,
    success: true,
    metadata: { mode: kycMode() },
  });
  revalidatePath("/dashboard");
  return { verified: true, demo };
}
