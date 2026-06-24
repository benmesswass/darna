import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/crypto";

/**
 * Jeton de réinitialisation de mot de passe : aléatoire (256 bits), haché en
 * base, TTL court, usage unique. Une seule demande active par utilisateur (les
 * précédentes sont purgées à l'émission). Module SERVEUR uniquement.
 *
 * Même idiome que src/lib/otp.ts (jeton jamais stocké en clair).
 */
const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Émet un nouveau jeton (purge les précédents de l'utilisateur) et le renvoie EN CLAIR. */
export async function issueResetToken(userId: string): Promise<string> {
  // base64url : sûr en URL, sans padding. 32 octets ⇒ 43 caractères.
  const token = randomBytes(32).toString("base64url");

  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });
  return token;
}

/**
 * Consomme un jeton : renvoie l'`userId` si valide (existant + non expiré), et
 * supprime TOUS les jetons de l'utilisateur (usage unique, pas de rejeu). En
 * cas d'expiration, purge aussi et renvoie null. Jeton inconnu ⇒ null.
 */
export async function consumeResetToken(token: string): Promise<string | null> {
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { userId: true, expiresAt: true },
  });
  if (!row) return null;

  // Expiré ⇒ purge et refus.
  if (row.expiresAt < new Date()) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } });
    return null;
  }

  // Usage unique : on supprime avant de rendre la main.
  await prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } });
  return row.userId;
}
