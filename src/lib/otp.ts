import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashOtp } from "@/lib/crypto";

/**
 * OTP de vérification KYC : code aléatoire 6 chiffres, haché en base, TTL court,
 * tentatives plafonnées. Une seule challenge active par utilisateur.
 * Module SERVEUR uniquement.
 */
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;

/** Émet un nouvel OTP (purge les précédents) et renvoie le code EN CLAIR à envoyer. */
export async function issueOtp(userId: string): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  await prisma.otpChallenge.deleteMany({ where: { userId } });
  await prisma.otpChallenge.create({
    data: {
      userId,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return code;
}

/**
 * Vérifie un code. Consomme la challenge en cas de succès ; incrémente le
 * compteur en cas d'échec ; refuse si expiré ou tentatives épuisées.
 */
export async function verifyOtp(userId: string, code: string): Promise<boolean> {
  const challenge = await prisma.otpChallenge.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return false;

  if (challenge.expiresAt < new Date()) {
    await prisma.otpChallenge.deleteMany({ where: { userId } });
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

  await prisma.otpChallenge.deleteMany({ where: { userId } });
  return true;
}
