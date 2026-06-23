"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { sendEmail } from "@/lib/mailer";
import { getEmailProvider } from "@/lib/mailer";
import { logAudit } from "@/lib/audit";

export type EmailVerifyState =
  | { error?: string; otp?: string; sent?: boolean; verified?: boolean; demo?: boolean }
  | undefined;

const verifyCodeSchema = z.object({
  otp: z.string().trim().regex(/^[0-9]{6}$/),
});

/**
 * Émet un OTP e-mail et l'envoie (ou l'affiche en mode démo).
 */
export async function requestEmailOtpAction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: EmailVerifyState
): Promise<EmailVerifyState> {
  const fr = await getT();
  const user = await requireUser();

  if (user.emailVerified) {
    return { verified: true };
  }

  if (!(await assertRateLimit("email-otp"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const code = await issueOtp(user.id, "EMAIL");
  const demo = getEmailProvider() === "demo";

  const sent = await sendEmail({
    to: user.email,
    subject: fr.email.mailSujet,
    html: fr.email.mailCorpsHtml(code),
  });

  await logAudit({
    action: "EMAIL_OTP_REQUESTED",
    userId: user.id,
    success: true,
    metadata: { demo },
  });

  revalidatePath("/dashboard/email");

  // Le code n'est renvoyé au client QU'EN MODE DÉMO (aucun email envoyé).
  return demo && !sent ? { sent: true, otp: code, demo: true } : { sent: true };
}

/**
 * Vérifie le code OTP e-mail et marque emailVerified = true en cas de succès.
 */
export async function verifyEmailOtpAction(
  _prev: EmailVerifyState,
  formData: FormData
): Promise<EmailVerifyState> {
  const fr = await getT();
  const user = await requireUser();

  if (user.emailVerified) {
    return { verified: true };
  }

  if (!(await assertRateLimit("email-otp-verif"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = verifyCodeSchema.safeParse({ otp: formData.get("otp") });
  if (!parsed.success) return { error: fr.email.otpInvalide };

  if (!(await verifyOtp(user.id, parsed.data.otp, "EMAIL"))) {
    return { error: fr.email.otpInvalide };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  await logAudit({
    action: "EMAIL_VERIFIED",
    userId: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  return { verified: true };
}
