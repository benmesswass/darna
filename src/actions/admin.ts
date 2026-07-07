"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireWakilOrAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { notifyMatchingSavedSearches } from "@/lib/saved-search";
import { applySuspension } from "@/lib/suspension";
import { notifyHostInvoiceReminder } from "@/lib/notification-center";
import { sendHostInvoiceReminderEmail } from "@/lib/notifications";

export type AdminActionState = { error?: string; success?: string } | undefined;

// ── PR1 — Vérification d'annonces ─────────────────────────────────────────────

const propertyIdSchema = z.object({
  propertyId: z.string().cuid(),
});

const verifyPropertySchema = z.object({
  propertyId: z.string().cuid(),
  verificationLevel: z.enum(["REMOTE", "ON_SITE"]),
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

  const parsed = verifyPropertySchema.safeParse({
    propertyId: formData.get("propertyId"),
    verificationLevel: formData.get("verificationLevel"),
  });
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
      status: "ACTIVE",
      verified: true,
      verificationLevel: parsed.data.verificationLevel,
      verifiedAt: new Date(),
      verifiedById: actor.id,
    },
  });

  await logAudit({
    action: "PROPERTY_VERIFIED",
    userId: actor.id,
    metadata: { propertyId: property.id, ownerId: property.ownerId },
  });

  // Alertes de recherche sauvegardée (F7) : l'annonce vient de devenir active,
  // c'est le moment où elle devient trouvable en recherche.
  await notifyMatchingSavedSearches(property.id);

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
      verificationLevel: null,
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
  interviewAt: z.string().optional(),
});

/**
 * Revoit une candidature Wakil (ACCEPTEE / REFUSEE / ENTRETIEN).
 * Si ACCEPTEE, promeut le compte utilisateur lié (isWakil = true).
 * Si ENTRETIEN, accepte une date/heure optionnelle (ISO string).
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
    interviewAt: formData.get("interviewAt") || undefined,
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const { applicationId, decision, interviewAt } = parsed.data;

  const application = await prisma.wakilApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, status: true, userId: true, email: true },
  });
  if (!application) return { error: fr.common.erreurInconnue };

  let interviewDate: Date | null | undefined = undefined;
  if (decision === "ENTRETIEN" && interviewAt) {
    const parsed = new Date(interviewAt);
    if (!isNaN(parsed.getTime())) interviewDate = parsed;
  } else if (decision !== "ENTRETIEN") {
    interviewDate = null; // clear if not entretien
  }

  await prisma.wakilApplication.update({
    where: { id: applicationId },
    data: {
      status: decision,
      reviewedAt: new Date(),
      reviewedById: actor.id,
      ...(interviewDate !== undefined ? { interviewAt: interviewDate } : {}),
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

const appIdSchema = z.object({ applicationId: z.string().cuid() });

/**
 * Soft-delete : archive une candidature (deletedAt = now).
 * Garde : admin uniquement.
 */
export async function softDeleteWakilApplicationAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const fr = await getT();
  const actor = await requireAdmin();

  const parsed = appIdSchema.safeParse({ applicationId: formData.get("applicationId") });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const application = await prisma.wakilApplication.findUnique({
    where: { id: parsed.data.applicationId },
    select: { id: true, email: true, deletedAt: true },
  });
  if (!application || application.deletedAt) return { error: fr.common.erreurInconnue };

  await prisma.wakilApplication.update({
    where: { id: parsed.data.applicationId },
    data: { deletedAt: new Date() },
  });

  await logAudit({
    action: "WAKIL_STATUS_CHANGED",
    userId: actor.id,
    metadata: { applicationId: parsed.data.applicationId, decision: "ARCHIVED", candidateEmail: application.email },
  });

  revalidatePath("/dashboard/admin/wakils");
  return { success: fr.admin.candidatureSupprimee };
}

/**
 * Hard-delete : supprime définitivement une candidature archivée.
 * Garde : admin uniquement.
 */
export async function hardDeleteWakilApplicationAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const fr = await getT();
  const actor = await requireAdmin();

  const parsed = appIdSchema.safeParse({ applicationId: formData.get("applicationId") });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const application = await prisma.wakilApplication.findUnique({
    where: { id: parsed.data.applicationId },
    select: { id: true, email: true, deletedAt: true },
  });
  if (!application || !application.deletedAt) return { error: fr.common.erreurInconnue };

  await prisma.wakilApplication.delete({
    where: { id: parsed.data.applicationId },
  });

  await logAudit({
    action: "WAKIL_STATUS_CHANGED",
    userId: actor.id,
    metadata: { applicationId: parsed.data.applicationId, decision: "HARD_DELETED", candidateEmail: application.email },
  });

  revalidatePath("/dashboard/admin/wakils");
  return { success: fr.admin.candidatureDefinitivementSupprimee };
}

// ── Suspension anti-bypass : réactivation d'un compte par un admin ───────────

const userIdSchema = z.object({ userId: z.string().cuid() });

/**
 * Réactive un compte suspendu pour cause de tentatives de bypass. Admin only.
 * Action à FormData directe (utilisée en formulaire serveur dans la page
 * « Signalements »).
 */
export async function reactivateUserAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) return;

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { suspended: false, suspendedAt: null },
  });

  await logAudit({
    action: "ACCOUNT_REACTIVATED",
    userId: actor.id,
    success: true,
    metadata: { targetUserId: parsed.data.userId },
  });

  revalidatePath("/dashboard/admin/signalements");
}

// ── Dashboard admin factures (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP8) ───────────

const invoiceIdSchema = z.object({ invoiceId: z.string().cuid() });

/**
 * Relance MANUELLE d'un hôte pour une facture impayée : notification in-app +
 * e-mail. Admin only. Action à FormData directe (formulaire serveur dans la
 * page « Factures »). Silencieuse sur une facture déjà réglée ou introuvable
 * — pas de valeur à relancer une dette qui n'existe plus.
 */
export async function sendHostInvoiceReminderAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const parsed = invoiceIdSchema.safeParse({ invoiceId: formData.get("invoiceId") });
  if (!parsed.success) return;

  const invoice = await prisma.hostInvoice.findUnique({
    where: { id: parsed.data.invoiceId },
    select: { status: true },
  });
  if (!invoice || invoice.status !== "EN_ATTENTE") return;

  await notifyHostInvoiceReminder(parsed.data.invoiceId);
  await sendHostInvoiceReminderEmail(parsed.data.invoiceId);
  await prisma.hostInvoice.update({
    where: { id: parsed.data.invoiceId },
    data: { lastReminderAt: new Date() },
  });

  await logAudit({
    action: "HOST_INVOICE_REMINDER_SENT",
    userId: actor.id,
    success: true,
    metadata: { invoiceId: parsed.data.invoiceId },
  });

  revalidatePath("/dashboard/admin/factures");
}

/**
 * Suspension MANUELLE d'un hôte pour facture impayée malgré relance. Admin
 * only. Réutilise le mécanisme de suspension progressive existant
 * (applySuspension) — même échelle (3j → 14j → indéfinie) que les autres
 * motifs, décision produit du 2026-07-07 (pas de palier dédié aux impayés).
 */
export async function suspendHostForInvoiceAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const parsed = z
    .object({ hostId: z.string().cuid(), invoiceId: z.string().cuid() })
    .safeParse({ hostId: formData.get("hostId"), invoiceId: formData.get("invoiceId") });
  if (!parsed.success) return;

  // applySuspension journalise déjà ACCOUNT_SUSPENDED (userId = hôte visé) ;
  // on journalise ICI en plus QUI (quel admin) a déclenché la sanction —
  // même convention que hostCancelBookingAction (src/actions/bookings.ts).
  await applySuspension(parsed.data.hostId, "HOST_INVOICE_OVERDUE", {
    invoiceId: parsed.data.invoiceId,
  });

  await logAudit({
    action: "HOST_INVOICE_MANUAL_SUSPENSION",
    userId: actor.id,
    success: true,
    metadata: { hostId: parsed.data.hostId, invoiceId: parsed.data.invoiceId },
  });

  revalidatePath("/dashboard/admin/factures");
}
