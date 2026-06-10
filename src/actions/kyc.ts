"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fr } from "@/lib/i18n/fr";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";

export type KycFormState =
  | { error?: string; otp?: string; verified?: boolean }
  | undefined;

/**
 * OTP de démonstration : dérivé de l'utilisateur et de la CIN, affiché à
 * l'écran (aucun SMS réel en V0). Déterministe → vérifiable sans stockage.
 */
function computeMockOtp(userId: string, cin: string): string {
  const digest = createHash("sha256")
    .update(`${userId}:${cin}:${process.env.AUTH_SECRET ?? "darna"}`)
    .digest("hex");
  return String(parseInt(digest.slice(0, 8), 16) % 1_000_000).padStart(6, "0");
}

const requestSchema = z.object({
  cin: z.string().trim().regex(/^[0-9]{8}$/),
  phone: z.string().trim().regex(/^\+?[0-9\s]{8,16}$/),
});

export async function requestKycOtpAction(
  _prev: KycFormState,
  formData: FormData
): Promise<KycFormState> {
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

  await prisma.user.update({
    where: { id: user.id },
    data: {
      cin: parsed.data.cin,
      phone: parsed.data.phone,
      kycStatus: "EN_ATTENTE",
    },
  });

  revalidatePath("/dashboard/kyc");
  return { otp: computeMockOtp(user.id, parsed.data.cin) };
}

const verifySchema = z.object({
  otp: z.string().trim().regex(/^[0-9]{6}$/),
});

export async function verifyKycOtpAction(
  _prev: KycFormState,
  formData: FormData
): Promise<KycFormState> {
  const user = await requireUser();
  if (user.kycStatus === "VERIFIE") return { verified: true };

  if (!(await assertRateLimit("otp-verif"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = verifySchema.safeParse({ otp: formData.get("otp") });
  if (!parsed.success) return { error: fr.kyc.otpInvalide };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { cin: true },
  });
  if (!dbUser?.cin) return { error: fr.kyc.otpInvalide };

  if (computeMockOtp(user.id, dbUser.cin) !== parsed.data.otp) {
    return { error: fr.kyc.otpInvalide };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { kycStatus: "VERIFIE", phoneVerified: true },
  });

  revalidatePath("/dashboard");
  return { verified: true };
}
