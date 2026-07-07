/**
 * Centre de notifications in-app (F9) : générique, au-delà de la messagerie
 * (cf. src/lib/messages.ts + MessagesNotifier). Le texte n'est JAMAIS figé en
 * base (convention i18n du projet) : seul `propertyTitle` est stocké, le
 * libellé complet est composé à l'affichage via notification-text.ts.
 * Module serveur uniquement (importe prisma).
 */

import { prisma } from "@/lib/prisma";
import { logStructured } from "@/lib/audit";
import { HOST_INVOICE_DUE_SOON_DAYS, LISTING_EXPIRE_SOON_DAYS } from "@/lib/config";
import { sendHostInvoiceDueSoonEmail, sendHostInvoiceOverdueEmail } from "@/lib/notifications";

export type NotificationType =
  | "RESERVATION_CONFIRMEE"
  | "RESERVATION_ANNULEE"
  | "AVIS_RECU"
  | "AVIS_HOTE_RECU"
  | "ANNONCE_EXPIRE_BIENTOT"
  | "ALERTE_NOUVELLE_ANNONCE"
  // Rail 2 (paiement sur place, PAIEMENT_SUR_PLACE_ROADMAP.md §PSP3).
  | "DEMANDE_CASH_RECUE"
  | "RESERVATION_REFUSEE"
  // Annulation hôte (ANNULATION_HOTE_ROADMAP.md §AH1).
  | "RESERVATION_ANNULEE_PAR_HOTE"
  // Dashboard admin factures (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP8).
  | "HOST_INVOICE_RELANCE"
  // Rappels automatiques HostInvoice (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP5).
  | "FACTURE_BIENTOT_DUE"
  | "FACTURE_EN_RETARD";

async function createNotification(
  userId: string,
  type: NotificationType,
  opts: { propertyTitle?: string; href?: string } = {}
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        propertyTitle: opts.propertyTitle ?? null,
        href: opts.href ?? null,
      },
    });
  } catch (err) {
    // Jamais bloquant : une notification manquée ne doit jamais faire échouer
    // l'action métier qui la déclenche (même principe que sendEmail).
    logStructured("error", "notif.create_failed", {
      userId,
      type,
      error: (err as Error).message,
    });
  }
}

/** Notifie le VOYAGEUR que sa réservation est confirmée. */
export async function notifyBookingConfirmed(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true, property: { select: { title: true } } },
  });
  if (!booking) return;
  await createNotification(booking.guestId, "RESERVATION_CONFIRMEE", {
    propertyTitle: booking.property.title,
    href: "/dashboard/reservations",
  });
}

/** Notifie l'HÔTE qu'une réservation sur son annonce a été annulée par le voyageur. */
export async function notifyBookingCancelled(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { property: { select: { title: true, ownerId: true } } },
  });
  if (!booking) return;
  await createNotification(booking.property.ownerId, "RESERVATION_ANNULEE", {
    propertyTitle: booking.property.title,
    href: "/dashboard/reservations",
  });
}

/**
 * Notifie le VOYAGEUR que l'hôte a annulé sa réservation (ANNULATION_HOTE_
 * ROADMAP.md §AH1/§AH3/§AH4/§AH6) — distinct de notifyBookingCancelled
 * (annulation par le voyageur lui-même, notifie l'hôte). Pointe vers
 * `/relogement/[bookingId]`, qui calcule la liste de suggestions au moment
 * de la consultation (pas figée à l'instant de l'annulation) et génère lui-
 * même le token de réduction ponctuelle — voir cette page pour le calcul.
 */
export async function notifyBookingCancelledByHost(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true, property: { select: { title: true } } },
  });
  if (!booking) return;

  await createNotification(booking.guestId, "RESERVATION_ANNULEE_PAR_HOTE", {
    propertyTitle: booking.property.title,
    href: `/relogement/${bookingId}`,
  });
}

/** Notifie le PROPRIÉTAIRE qu'un nouvel avis (voyageur → annonce) a été publié. */
export async function notifyReviewReceived(propertyId: string): Promise<void> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { title: true, slug: true, ownerId: true },
  });
  if (!property) return;
  await createNotification(property.ownerId, "AVIS_RECU", {
    propertyTitle: property.title,
    href: `/annonce/${property.slug}#avis`,
  });
}

/** Notifie le VOYAGEUR que son hôte a laissé un avis (hôte → voyageur) sur son séjour. */
export async function notifyGuestReviewReceived(guestId: string): Promise<void> {
  await createNotification(guestId, "AVIS_HOTE_RECU", { href: "/dashboard/reservations" });
}

/** Notifie un voyageur qu'une nouvelle annonce correspond à son alerte enregistrée (F7). */
export async function notifyNewListingMatch(
  userId: string,
  propertyTitle: string,
  href: string
): Promise<void> {
  await createNotification(userId, "ALERTE_NOUVELLE_ANNONCE", { propertyTitle, href });
}

/** Notifie l'HÔTE d'une nouvelle demande de réservation Rail 2 (paiement sur place) à traiter. */
export async function notifyCashBookingRequested(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { property: { select: { title: true, ownerId: true } } },
  });
  if (!booking) return;
  await createNotification(booking.property.ownerId, "DEMANDE_CASH_RECUE", {
    propertyTitle: booking.property.title,
    href: "/dashboard/reservations",
  });
}

/** Notifie le VOYAGEUR que l'hôte a décliné sa demande de réservation Rail 2. */
export async function notifyCashBookingDeclined(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true, property: { select: { title: true } } },
  });
  if (!booking) return;
  await createNotification(booking.guestId, "RESERVATION_REFUSEE", {
    propertyTitle: booking.property.title,
    href: "/dashboard/reservations",
  });
}

/**
 * Relance MANUELLE d'un hôte pour une facture impayée (PAIEMENT_SUR_PLACE_
 * ROADMAP.md §PSP8, dashboard admin) — déclenchée par un admin, pas par un
 * job. Pointe vers la page de paiement de CETTE facture précise.
 */
export async function notifyHostInvoiceReminder(invoiceId: string): Promise<void> {
  const invoice = await prisma.hostInvoice.findUnique({
    where: { id: invoiceId },
    select: { hostId: true, booking: { select: { property: { select: { title: true } } } } },
  });
  if (!invoice) return;
  await createNotification(invoice.hostId, "HOST_INVOICE_RELANCE", {
    propertyTitle: invoice.booking.property.title,
    href: `/dashboard/factures/${invoiceId}`,
  });
}

/**
 * Détection paresseuse des annonces bientôt expirées (même idiome que
 * clearExpiredFeatured/BOOKING_EXPIRY : pas de cron, calculé à la lecture,
 * cf. src/lib/listings.ts). Dédupliquée par un index unique PARTIEL en base
 * (userId, href) WHERE type = 'ANNONCE_EXPIRE_BIENTOT' (cf. migration
 * 20260702170000_add_notification) — pas de lecture-puis-écriture qui
 * pourrait doublonner sous requêtes concurrentes (deux sondes simultanées).
 * La violation de contrainte (P2002) est attendue et silencieuse : elle
 * signifie juste « déjà notifié pour cette annonce ».
 */
export async function ensureExpiringSoonNotifications(userId: string): Promise<void> {
  const now = new Date();
  const soon = new Date(now.getTime() + LISTING_EXPIRE_SOON_DAYS * 24 * 60 * 60 * 1000);

  const properties = await prisma.property.findMany({
    where: { ownerId: userId, status: "ACTIVE", expiresAt: { gt: now, lte: soon } },
    select: { id: true, title: true },
  });

  for (const p of properties) {
    // Lien direct vers l'édition (republication en un clic) — sert aussi de
    // clé de dédoublonnage (unique par annonce, cf. index partiel).
    const href = `/dashboard/annonces/${p.id}/modifier`;
    try {
      await prisma.notification.create({
        data: { userId, type: "ANNONCE_EXPIRE_BIENTOT", propertyTitle: p.title, href },
      });
    } catch (err) {
      if ((err as { code?: string }).code !== "P2002") {
        logStructured("error", "notif.expiring_soon_failed", {
          userId,
          propertyId: p.id,
          error: (err as Error).message,
        });
      }
    }
  }
}

/**
 * Détection paresseuse des HostInvoice EN_ATTENTE bientôt dues / en retard
 * (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP5) — MÊME idiome exact que
 * ensureExpiringSoonNotifications ci-dessus : pas de cron, calculé au sondage
 * (NotificationBell via /api/notifications), dédupliqué par un index unique
 * PARTIEL en base PAR TYPE (cf. migration 20260707170000_add_host_invoice_
 * reminder_notif) — une facture peut recevoir AU PLUS une notif
 * FACTURE_BIENTOT_DUE puis, plus tard, AU PLUS une notif FACTURE_EN_RETARD
 * (types distincts, indexés séparément → pas de collision entre les deux).
 * P2002 attendu et silencieux = « déjà notifié à ce palier pour cette facture ».
 *
 * LIMITE ASSUMÉE (comme pour ANNONCE_EXPIRE_BIENTOT) : ne se déclenche qu'au
 * sondage, donc seulement si l'hôte est connecté ou récemment connecté — pas
 * de garantie de délivrance sinon. Compromis du projet (pas de cron) ; à
 * revoir en P2 séparé si insuffisant en usage réel.
 */
export async function ensureHostInvoiceReminders(userId: string): Promise<void> {
  const now = new Date();
  const soon = new Date(now.getTime() + HOST_INVOICE_DUE_SOON_DAYS * 24 * 60 * 60 * 1000);

  const invoices = await prisma.hostInvoice.findMany({
    where: { hostId: userId, status: "EN_ATTENTE", dueAt: { lte: soon } },
    select: { id: true, dueAt: true, booking: { select: { property: { select: { title: true } } } } },
  });

  for (const inv of invoices) {
    const overdue = inv.dueAt < now;
    const type: NotificationType = overdue ? "FACTURE_EN_RETARD" : "FACTURE_BIENTOT_DUE";
    // Pointe directement vers la page de paiement de CETTE facture (§PSP4) —
    // plus actionnable qu'une simple ancre sur la liste.
    const href = `/dashboard/factures/${inv.id}`;
    try {
      await prisma.notification.create({
        data: { userId, type, propertyTitle: inv.booking.property.title, href },
      });
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") continue; // déjà notifié à ce palier
      logStructured("error", "notif.host_invoice_reminder_lazy_failed", {
        userId,
        invoiceId: inv.id,
        error: (err as Error).message,
      });
      continue;
    }

    // E-mail UNIQUEMENT quand une notif a été réellement créée (pas de doublon).
    if (overdue) await sendHostInvoiceOverdueEmail(inv.id);
    else await sendHostInvoiceDueSoonEmail(inv.id);
  }
}
