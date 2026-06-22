import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashOtp } from "@/lib/crypto";

/**
 * OTP de vérification KYC ou email : code aléatoire 6 chiffres, haché en base,
 * TTL court, tentatives plafonnées. Une seule challenge active par (userId, purpose).
 * Module SERVEUR uniquement.
 */
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;

/** Émet un nouvel OTP (purge les précédents du même purpose) et renvoie le code EN CLAIR. */
export async function issueOtp(userId: string, purpose: "KYC" | "EMAIL" = "KYC"): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  await prisma.otpChallenge.deleteMany({ where: { userId, purpose } });
  await prisma.otpChallenge.create({
    data: {
      userId,
      purpose,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return code;
}

/**
 * Vérifie un code pour un purpose donné. Consomme la challenge en cas de succès ;
 * incrémente le compteur en cas d'échec ; refuse si expiré ou tentatives épuisées.
 */
export async function verifyOtp(
  userId: string,
  code: string,
  purpose: "KYC" | "EMAIL" = "KYC"
): Promise<boolean> {
  const challenge = await prisma.otpChallenge.findFirst({
    where: { userId, purpose },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return false;

  if (challenge.expiresAt < new Date()) {
    await prisma.otpChallenge.deleteMany({ where: { userId, purpose } });
    return false;
  }
  if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) return false;

  if (challenge.codeHash !== hashOtp(code)) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  await prisma.otpChallenge.deleteMany({ where: { userId, purpose } });
  return true;
}
