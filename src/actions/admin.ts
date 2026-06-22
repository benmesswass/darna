"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireWakilOrAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export type AdminActionState = { error?: string; success?: string } | undefined;

// ── PR1 — Vérification d'annonces ─────────────────────────────────────────────

const propertyIdSchema = z.object({
  propertyId: z.string().cuid(),
});

/**
 * Marque une annonce comme vérifiée (badge « Vérifié Darna »).
 * Règle métier : REFUSE si le propriétaire n'est pas vérifié (VERIFIE ou DEMO_VERIFIE).
 * Garde : admin ou Wakil.
 */
export async function verifyPropertyAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const fr = await getT();
  const actor = await requireWakilOrAdmin();

  const parsed = propertyIdSchema.safeParse({ propertyId: formData.get("propertyId") });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const property = await prisma.property.findUnique({
    where: { id: parsed.data.propertyId },
    select: {
      id: true,
      verified: true,
      ownerId: true,
      owner: { select: { kycStatus: true } },
    },
  });

  if (!property) return { error: fr.common.erreurInconnue };

  // Règle métier : le propriétaire doit être vérifié (réel ou démo) pour que
  // l'annonce puisse recevoir le badge.
  const ownerKyc = property.owner.kycStatus;
  if (ownerKyc !== "VERIFIE" && ownerKyc !== "DEMO_VERIFIE") {
    return { error: fr.admin.proprietaireNonVerifie };
  }

  await prisma.property.update({
    where: { id: property.id },
    data: {
      verified: true,
      verifiedAt: new Date(),
      verifiedById: actor.id,
    },
  });

  await logAudit({
    action: "PROPERTY_VERIFIED",
    userId: actor.id,
    metadata: { propertyId: property.id, ownerId: property.ownerId },
  });

  revalidatePath("/dashboard/admin/annonces");
  return { success: fr.admin.annonceMiseAVerifiee };
}

/**
 * Retire le badge de vérification d'une annonce.
 * Garde : admin ou Wakil.
 */
export async function unverifyPropertyAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const fr = await getT();
  const actor = await requireWakilOrAdmin();

  const parsed = propertyIdSchema.safeParse({ propertyId: formData.get("propertyId") });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const property = await prisma.property.findUnique({
    where: { id: parsed.data.propertyId },
    select: { id: true, ownerId: true },
  });
  if (!property) return { error: fr.common.erreurInconnue };

  await prisma.property.update({
    where: { id: property.id },
    data: {
      verified: false,
      verifiedAt: null,
      verifiedById: null,
    },
  });

  await logAudit({
    action: "PROPERTY_UNVERIFIED",
    userId: actor.id,
    metadata: { propertyId: property.id, ownerId: property.ownerId },
  });

  revalidatePath("/dashboard/admin/annonces");
  return { success: fr.admin.annonceMiseANonVerifiee };
}

// ── PR2 — Workflow Wakil ───────────────────────────────────────────────────────

const reviewWakilSchema = z.object({
  applicationId: z.string().cuid(),
  decision: z.enum(["ACCEPTEE", "REFUSEE", "ENTRETIEN"]),
});

/**
 * Revoit une candidature Wakil (ACCEPTEE / REFUSEE / ENTRETIEN).
 * Si ACCEPTEE, promeut le compte utilisateur lié (isWakil = true).
 * Garde : admin uniquement.
 */
export async function reviewWakilApplicationAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const fr = await getT();
  const actor = await requireAdmin();

  const parsed = reviewWakilSchema.safeParse({
    applicationId: formData.get("applicationId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const { applicationId, decision } = parsed.data;

  const application = await prisma.wakilApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, status: true, userId: true, email: true },
  });
  if (!application) return { error: fr.common.erreurInconnue };

  await prisma.wakilApplication.update({
    where: { id: applicationId },
    data: {
      status: decision,
      reviewedAt: new Date(),
      reviewedById: actor.id,
    },
  });

  await logAudit({
    action: "WAKIL_STATUS_CHANGED",
    userId: actor.id,
    metadata: { applicationId, decision, candidateEmail: application.email },
  });

  // Promotion automatique si accepté et compte utilisateur lié
  if (decision === "ACCEPTEE" && application.userId) {
    await prisma.user.update({
      where: { id: application.userId },
      data: { isWakil: true },
    });
    await logAudit({
      action: "WAKIL_PROMOTED",
      userId: actor.id,
      metadata: { promotedUserId: application.userId },
    });
  }

  revalidatePath("/dashboard/admin/wakils");
  return { success: fr.admin.candidatureRevue };
}
