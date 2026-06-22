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
    },
  });
  return user;
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
