import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  kycStatus: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  isWakil: boolean;
  suspended: boolean;
  suspendedUntil: Date | null;
  suspensionCount: number;
  suspensionReason: string | null;
};

/**
 * Utilisateur connecté, relu en base à chaque requête (rôle et statut KYC
 * toujours frais), mémoïsé par rendu via React cache.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      kycStatus: true,
      phoneVerified: true,
      emailVerified: true,
      isWakil: true,
      suspended: true,
      suspendedUntil: true,
      suspensionCount: true,
      suspensionReason: true,
      tokenVersion: true,
    },
  });
  if (!user) return null;

  // JWT tokenVersion absent (ancien token) et DB 0 (nouveau champ) → 0 des deux côtés.
  const jwtVersion = session.user.tokenVersion ?? 0;
  const dbVersion = user.tokenVersion ?? 0;
  if (dbVersion !== jwtVersion) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tokenVersion: _, ...sessionUser } = user;
  return sessionUser;
});

/** Garde serveur : lève si non connecté (mutations). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("NON_AUTHENTIFIE");
  return user;
}

/** Garde serveur : réservé aux annonceurs (hôte ou agence). */
export async function requireLister(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "HOTE" && user.role !== "AGENCE") {
    throw new Error("ROLE_INSUFFISANT");
  }
  return user;
}

/** Garde serveur : réservé aux administrateurs Darna. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("ROLE_INSUFFISANT");
  }
  return user;
}

/** Garde serveur : réservé aux Wakils ET aux administrateurs. */
export async function requireWakilOrAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && !user.isWakil) {
    throw new Error("ROLE_INSUFFISANT");
  }
  return user;
}
