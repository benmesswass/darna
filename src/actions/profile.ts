"use server";

import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { deleteUploadedImage, saveUploadedImage } from "@/lib/uploads";

export type ProfileFormState =
  | { error?: string; success?: string }
  | undefined;

/**
 * Mise à jour des informations personnelles : nom et téléphone.
 * L'email reste l'identifiant de connexion (non modifiable ici) ; le rôle
 * est attribué à l'inscription et ne se change pas côté client. Téléphone
 * optionnel : le revérifier remet `phoneVerified` à false (cohérence KYC).
 */
const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s]{8,16}$/)
    .optional()
    .or(z.literal("")),
});

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const fr = await getT();
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const newPhone = parsed.data.phone ? parsed.data.phone : null;
  // Si le numéro change, l'ancienne vérification ne vaut plus.
  const phoneChanged = newPhone !== (user.phone ?? null);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: newPhone,
      ...(phoneChanged ? { phoneVerified: false } : {}),
    },
  });

  await logAudit({
    action: "PROFILE_UPDATED",
    userId: user.id,
    success: true,
    metadata: { phoneChanged },
  });

  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard");
  return { success: fr.profil.infosEnregistrees };
}

/**
 * Photo de profil : upload local validé (MIME + magic bytes + taille) via
 * `saveUploadedImage`. L'ancienne photo est effacée du disque (best-effort).
 */
export async function updateAvatarAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const fr = await getT();
  const user = await requireUser();

  if (!(await assertRateLimit("avatar"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: fr.profil.photoErreur };
  }

  const url = await saveUploadedImage(file);
  if (!url) return { error: fr.profil.photoErreur };

  const previous = await prisma.user.findUnique({
    where: { id: user.id },
    select: { image: true },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { image: url },
  });

  if (previous?.image) await deleteUploadedImage(previous.image);

  await logAudit({
    action: "AVATAR_UPDATED",
    userId: user.id,
    success: true,
  });

  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard");
  return { success: fr.profil.photoEnregistree };
}

/** Suppression de la photo de profil (fichier effacé du disque, best-effort). */
export async function removeAvatarAction(): Promise<ProfileFormState> {
  const fr = await getT();
  const user = await requireUser();

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { image: true },
  });

  if (current?.image) {
    await prisma.user.update({
      where: { id: user.id },
      data: { image: null },
    });
    await deleteUploadedImage(current.image);
    await logAudit({
      action: "AVATAR_UPDATED",
      userId: user.id,
      success: true,
      metadata: { removed: true },
    });
  }

  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard");
  return { success: fr.profil.photoSupprimee };
}

/**
 * Changement de mot de passe : exige le mot de passe actuel (revérifié côté
 * serveur), applique la même politique que l'inscription (≥ 8 caractères,
 * au moins un chiffre — NIST 800-63B). Rate-limité.
 */
const passwordSchema = z
  .string()
  .min(8)
  .max(200)
  .regex(/[0-9]/);

export async function changePasswordAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const fr = await getT();
  const user = await requireUser();

  if (!(await assertRateLimit("change-password"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const current = String(formData.get("currentPassword") ?? "");
  const next = formData.get("newPassword");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const parsed = passwordSchema.safeParse(next);
  if (!parsed.success) return { error: fr.profil.mdpRegles };
  if (parsed.data !== confirm) return { error: fr.profil.mdpConfirmationInvalide };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!dbUser) return { error: fr.common.erreurInconnue };

  const ok = await bcrypt.compare(current, dbUser.passwordHash);
  if (!ok) {
    await logAudit({
      action: "PASSWORD_CHANGED",
      userId: user.id,
      success: false,
      metadata: { reason: "wrong_current_password" },
    });
    return { error: fr.profil.mdpActuelInvalide };
  }

  // Refuse de réutiliser le même mot de passe.
  if (await bcrypt.compare(parsed.data, dbUser.passwordHash)) {
    return { error: fr.profil.mdpIdentique };
  }

  const passwordHash = await bcrypt.hash(parsed.data, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });

  await logAudit({
    action: "PASSWORD_CHANGED",
    userId: user.id,
    success: true,
  });

  return { success: fr.profil.mdpEnregistre };
}

/**
 * Suppression de compte (LANCEMENT_ROADMAP.md §L7.3) — ANONYMISATION en
 * place, jamais un `prisma.user.delete()` : Booking/HostInvoice/Review
 * gardent leur ligne (l'historique comptable d'un HÔTE ne doit pas
 * disparaître parce qu'un voyageur supprime son compte, décision explicite
 * de Wassim). name/email/phone/image/cin/cinHash sont scrubbés,
 * passwordHash + tokenVersion invalidés (même mécanisme que
 * changePasswordAction — un JWT existant est rejeté au prochain
 * getSessionUser()), `deletedAt` posé. Les annonces actives sont retirées de
 * la recherche via `expiresAt` (mécanisme d'expiration EXISTANT, jamais un
 * nouveau statut — cf. activeListingWhere()).
 */
const deleteAccountSchema = z.object({ password: z.string().min(1) });

export async function deleteAccountAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const fr = await getT();
  const user = await requireUser();

  if (!(await assertRateLimit("delete-account"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = deleteAccountSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: fr.profil.supprimerMdpRequis };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, image: true },
  });
  if (!dbUser) return { error: fr.common.erreurInconnue };

  const ok = await bcrypt.compare(parsed.data.password, dbUser.passwordHash);
  if (!ok) {
    await logAudit({
      action: "ACCOUNT_DELETED",
      userId: user.id,
      success: false,
      metadata: { reason: "wrong_password" },
    });
    return { error: fr.profil.mdpActuelInvalide };
  }

  // Blocage : toute réservation encore active (voyageur OU hôte via ses
  // annonces) doit être annulée/terminée avant de pouvoir supprimer le
  // compte — jamais une contrepartie qui se retrouve sans interlocuteur.
  const activeBooking = await prisma.booking.findFirst({
    where: {
      OR: [{ guestId: user.id }, { property: { ownerId: user.id } }],
      status: { notIn: ["ANNULEE", "TERMINEE"] },
    },
    select: { id: true },
  });
  if (activeBooking) return { error: fr.profil.supprimerReservationActive };

  const placeholderEmail = `deleted-${randomUUID()}@darna.invalid`;
  const unusablePasswordHash = await bcrypt.hash(randomUUID(), 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        name: "Utilisateur supprimé",
        email: placeholderEmail,
        phone: null,
        image: null,
        cin: null,
        cinHash: null,
        kycStatus: "NON_VERIFIE",
        passwordHash: unusablePasswordHash,
        deletedAt: new Date(),
        tokenVersion: { increment: 1 },
      },
    }),
    // Retire les annonces de la recherche/sitemap via le mécanisme
    // d'expiration EXISTANT (activeListingWhere() filtre déjà expiresAt) —
    // jamais un nouveau statut, jamais une suppression des lignes.
    prisma.property.updateMany({
      where: { ownerId: user.id, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    }),
  ]);

  if (dbUser.image) await deleteUploadedImage(dbUser.image);

  await logAudit({ action: "ACCOUNT_DELETED", userId: user.id, success: true });

  revalidatePath("/dashboard/annonces");
  await signOut({ redirectTo: "/" });
}
