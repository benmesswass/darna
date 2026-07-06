/**
 * Centre de notifications in-app (F9) : générique, au-delà de la messagerie
 * (cf. src/lib/messages.ts + MessagesNotifier). Le texte n'est JAMAIS figé en
 * base (convention i18n du projet) : seul `propertyTitle` est stocké, le
 * libellé complet est composé à l'affichage via notification-text.ts.
 * Module serveur uniquement (importe prisma).
 */

import { prisma } from "@/lib/prisma";
import { logStructured } from "@/lib/audit";
import { LISTING_EXPIRE_SOON_DAYS } from "@/lib/config";

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
  | "RESERVATION_ANNULEE_PAR_HOTE";

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
 * ROADMAP.md §AH1) — distinct de notifyBookingCancelled (annulation par le
 * voyageur lui-même, notifie l'hôte). `href` pointe vers /sejours pour
 * l'instant ; remplacé par les suggestions de relogement en AH6.
 */
export async function notifyBookingCancelledByHost(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true, property: { select: { title: true } } },
  });
  if (!booking) return;
  await createNotification(booking.guestId, "RESERVATION_ANNULEE_PAR_HOTE", {
    propertyTitle: booking.property.title,
    href: "/sejours",
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
