import { prisma } from "@/lib/prisma";
import { captureError } from "@/lib/observability";
import { sendBookingAbandonReminderEmail } from "@/lib/notifications";
import { logProductEvent } from "@/lib/product-events";
import { SITE_URL, BOOKING_ABANDON_REMINDER_WINDOW_HOURS } from "@/lib/config";

/**
 * Job de relance de réservation abandonnée (LANCEMENT_ROADMAP.md §L3.3,
 * GROWTH_ROADMAP.md §G6) — le levier de conversion « panier abandonné » le
 * plus documenté du secteur, gelé sur l'arbitrage « zéro cron » jusqu'à L3.1.
 *
 * Sélectionne les `Booking` `EN_ATTENTE` dont le hold a expiré il y a moins de
 * `BOOKING_ABANDON_REMINDER_WINDOW_HOURS`, notifie + e-mail le voyageur avec un
 * lien direct vers l'annonce. Anti-double-envoi : un index unique PARTIEL en
 * base sur `Notification(userId, href) WHERE type = 'RESERVATION_ABANDONNEE'`
 * (migration 20260727103800) — l'existence de la notification SUFFIT, aucun
 * nouveau champ sur `Booking`. `href` inclut `?resa=<bookingId>` pour que la
 * clé reste unique PAR RÉSERVATION (pas seulement par annonce) : un même
 * voyageur peut abandonner deux réservations différentes sur la même annonce
 * sans que la 2e relance soit bloquée par la 1re.
 */
export async function remindAbandonedBookings(): Promise<{ checked: number; reminded: number }> {
  const now = Date.now();
  const windowMs = BOOKING_ABANDON_REMINDER_WINDOW_HOURS * 60 * 60 * 1000;

  const rows = await prisma.booking.findMany({
    where: {
      status: "EN_ATTENTE",
      expiresAt: { lt: new Date(now), gt: new Date(now - windowMs) },
    },
    select: {
      id: true,
      guestId: true,
      property: { select: { slug: true, title: true } },
    },
  });

  let reminded = 0;
  for (const row of rows) {
    const href = `/annonce/${row.property.slug}?resa=${row.id}`;

    try {
      await prisma.notification.create({
        data: {
          userId: row.guestId,
          type: "RESERVATION_ABANDONNEE",
          propertyTitle: row.property.title,
          href,
        },
      });
    } catch (err) {
      // P2002 = déjà relancé pour cette réservation (course concurrente entre
      // deux ticks, ou rejeu) — silencieux, comportement attendu.
      if ((err as { code?: string }).code === "P2002") continue;
      await captureError(err, { entity: "Booking", id: row.id, phase: "abandon_reminder" });
      continue;
    }

    // La notification est LA clé de dédoublonnage : elle doit avoir réussi
    // (pas de P2002) avant d'envoyer l'e-mail, pour ne jamais relancer deux
    // fois par e-mail non plus si le job est rejoué après un crash partiel.
    await sendBookingAbandonReminderEmail(row.id, `${SITE_URL}${href}`);
    await logProductEvent({
      event: "BOOKING_ABANDON_REMINDED",
      userId: row.guestId,
      metadata: { bookingId: row.id },
    });
    reminded++;
  }

  return { checked: rows.length, reminded };
}
