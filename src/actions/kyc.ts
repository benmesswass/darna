"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { composeE164, sendOtp } from "@/lib/otp-channel";
import { encryptSensitive, hashCin } from "@/lib/crypto";
import { kycMode } from "@/lib/modes";
import { logAudit } from "@/lib/audit";

export type KycFormState =
  | { error?: string; otp?: string; sent?: boolean; verified?: boolean; demo?: boolean }
  | undefined;

/** Identité (CIN) considérée comme vérifiée (réel OU démo). */
function isCinVerified(status: string): boolean {
  return status === "VERIFIE" || status === "DEMO_VERIFIE";
}

/** Forme E.164 attendue : +<indicatif><national>, 8 à 15 chiffres au total. */
const E164_RE = /^\+[1-9]\d{7,14}$/;

// ── Étape « Téléphone » : OTP (SMS / WhatsApp) ───────────────────────────────

const phoneSchema = z.object({
  // Indicatif pays (chiffres, éventuellement préfixé +) + numéro national.
  phoneCountry: z.string().trim().regex(/^\+?[0-9]{1,4}$/),
  phone: z.string().trim().regex(/^[0-9\s().\-]{6,18}$/),
});

export async function requestPhoneOtpAction(
  _prev: KycFormState,
  formData: FormData
): Promise<KycFormState> {
  const fr = await getT();
  const user = await requireUser();
  if (user.phoneVerified) return { verified: true };

  if (!(await assertRateLimit("otp"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = phoneSchema.safeParse({
    phoneCountry: formData.get("phoneCountry"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  // Numéro recomposé au format international E.164 (lève l'ambiguïté d'un
  // numéro national à zéro de tête) et revalidé strictement côté serveur.
  const phoneE164 = composeE164(parsed.data.phoneCountry, parsed.data.phone);
  if (!E164_RE.test(phoneE164)) return { error: fr.common.champsRequis };

  await prisma.user.update({ where: { id: user.id }, data: { phone: phoneE164 } });

  const code = await issueOtp(user.id, "KYC");
  let sent: boolean;
  try {
    sent = await sendOtp(phoneE164, code);
  } catch {
    await logAudit({ action: "KYC_OTP_REQUESTED", userId: user.id, success: false });
    return { error: fr.kyc.otpEnvoiEchoue };
  }

  await logAudit({ action: "KYC_OTP_REQUESTED", userId: user.id, success: true });
  revalidatePath("/dashboard/verifications");

  // Le code n'est renvoyé au client QU'EN MODE DÉMO (sendOtp n'a rien envoyé).
  return kycMode() === "demo" && !sent ? { sent: true, otp: code } : { sent: true };
}

const otpSchema = z.object({ otp: z.string().trim().regex(/^[0-9]{6}$/) });

export async function verifyPhoneOtpAction(
  _prev: KycFormState,
  formData: FormData
): Promise<KycFormState> {
  const fr = await getT();
  const user = await requireUser();
  if (user.phoneVerified) return { verified: true };

  if (!(await assertRateLimit("otp-verif"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = otpSchema.safeParse({ otp: formData.get("otp") });
  if (!parsed.success) return { error: fr.kyc.otpInvalide };

  if (!(await verifyOtp(user.id, parsed.data.otp))) {
    return { error: fr.kyc.otpInvalide };
  }

  // Téléphone confirmé (étape franchie). Le niveau démo/réel de l'identité est
  // porté par kycStatus (étape CIN), pas par le simple flag téléphone.
  await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
  await logAudit({ action: "PHONE_VERIFIED", userId: user.id, success: true });
  revalidatePath("/dashboard");
  return { verified: true };
}

// ── Étape « CIN » : pièce d'identité, unique inter-comptes ───────────────────

const cinSchema = z.object({ cin: z.string().trim().regex(/^[0-9]{8}$/) });

export async function submitCinAction(
  _prev: KycFormState,
  formData: FormData
): Promise<KycFormState> {
  const fr = await getT();
  const user = await requireUser();
  if (isCinVerified(user.kycStatus)) {
    return { verified: true, demo: user.kycStatus === "DEMO_VERIFIE" };
  }
  // L'identité s'appuie sur un téléphone déjà confirmé (ordre des étapes).
  if (!user.phoneVerified) return { error: fr.kyc.telephoneRequis };

  if (!(await assertRateLimit("kyc-cin"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = cinSchema.safeParse({ cin: formData.get("cin") });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const cinHash = hashCin(parsed.data.cin);
  // Unicité : aucune autre personne ne peut déjà détenir cette CIN — empêche de
  // recréer un compte avec la même pièce d'identité.
  const taken = await prisma.user.findFirst({
    where: { cinHash, NOT: { id: user.id } },
    select: { id: true },
  });
  if (taken) return { error: fr.kyc.cinDejaUtilisee };

  const demo = kycMode() === "demo";
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        cin: encryptSensitive(parsed.data.cin),
        cinHash,
        kycStatus: demo ? "DEMO_VERIFIE" : "VERIFIE",
      },
    });
  } catch (e) {
    // Garde-fou course : l'index unique a tranché entre deux soumissions.
    if ((e as { code?: string }).code === "P2002") {
      return { error: fr.kyc.cinDejaUtilisee };
    }
    throw e;
  }

  await logAudit({
    action: "CIN_VERIFIED",
    userId: user.id,
    success: true,
    metadata: { mode: kycMode() },
  });
  revalidatePath("/dashboard");
  return { verified: true, demo };
}
