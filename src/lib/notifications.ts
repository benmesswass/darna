/**
 * Notifications transactionnelles — e-mails liés au cycle de vie d'une
 * réservation. Découplé du provider (cf. src/lib/mailer.ts) : en mode démo
 * (EMAIL_PROVIDER absent), sendEmail est un no-op journalisé → zéro config,
 * la démo reste complète sans clé Resend.
 *
 * LANGUE : français canonique (même exception assumée que les metadata SEO).
 * Ces e-mails partent souvent d'un contexte SANS cookie de locale — le webhook
 * Konnect est appelé par leur serveur, pas par le navigateur du voyageur — donc
 * on ne peut pas dériver la langue du destinataire de façon fiable. On importe
 * donc directement le dictionnaire `fr`.
 *
 * JAMAIS BLOQUANT : un échec d'envoi (provider down, clé invalide) ne doit
 * jamais annuler ni faire échouer une réservation DÉJÀ payée. Toute erreur est
 * journalisée et avalée. Module SERVEUR uniquement.
 */

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { fr as frMail } from "@/lib/i18n/fr";
import { formatDateFr, formatTndServer } from "@/lib/format";
import { logStructured } from "@/lib/audit";
import { SITE_URL } from "@/lib/config";

/**
 * Envoie l'e-mail de confirmation de réservation au voyageur. Appelé au moment
 * EXACT où la réservation bascule en CONFIRMEE (paiement Konnect réglé OU
 * séquestre simulé) — donc une seule fois par réservation (les deux points
 * d'appel ne confirment qu'une fois, cf. settleKonnectBooking / confirmPaymentAction).
 */
export async function sendBookingConfirmationEmail(bookingId: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        guests: true,
        totalPrice: true,
        demo: true,
        guest: { select: { email: true, name: true } },
        property: { select: { title: true } },
      },
    });

    if (!booking) {
      logStructured("warn", "notif.booking_confirm_not_found", { bookingId });
      return;
    }

    const nights = Math.max(
      1,
      Math.round((booking.checkOut.getTime() - booking.checkIn.getTime()) / 86_400_000)
    );

    await sendEmail({
      to: booking.guest.email,
      subject: frMail.email.bookingConfirmSujet(booking.property.title),
      html: frMail.email.bookingConfirmHtml({
        guestName: booking.guest.name,
        propertyTitle: booking.property.title,
        checkIn: formatDateFr(booking.checkIn),
        checkOut: formatDateFr(booking.checkOut),
        guests: booking.guests,
        nights,
        total: formatTndServer(booking.totalPrice),
        url: `${SITE_URL}/dashboard/reservations`,
        demo: booking.demo,
      }),
    });
  } catch (err) {
    // Non bloquant : la réservation est confirmée quoi qu'il arrive à l'e-mail.
    logStructured("error", "notif.booking_confirm_failed", {
      bookingId,
      error: (err as Error).message,
    });
  }
}

/** Échappe le HTML d'un extrait de message inséré dans le corps de l'e-mail. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Notifie par e-mail le DESTINATAIRE d'un nouveau message (l'autre participant
 * de la réservation, jamais l'auteur). Appelé depuis sendMessageAction APRÈS la
 * création du message. JAMAIS BLOQUANT : un échec d'envoi n'annule pas le
 * message déjà enregistré (toute erreur est journalisée et avalée).
 */
export async function sendNewMessageEmail(messageId: string): Promise<void> {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        body: true,
        senderId: true,
        bookingId: true,
        booking: {
          select: {
            guest: { select: { id: true, name: true, email: true } },
            property: {
              select: { title: true, owner: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!message) {
      logStructured("warn", "notif.message_not_found", { messageId });
      return;
    }

    const { guest } = message.booking;
    const owner = message.booking.property.owner;
    // Le destinataire est celui des deux participants qui n'a pas écrit.
    const sender = message.senderId === guest.id ? guest : owner;
    const recipient = message.senderId === guest.id ? owner : guest;

    // Extrait court et échappé (le corps peut contenir des caractères HTML).
    const trimmed = message.body.trim();
    const preview = escapeHtml(trimmed.length > 140 ? `${trimmed.slice(0, 140)}…` : trimmed);

    await sendEmail({
      to: recipient.email,
      subject: frMail.email.newMessageSujet(message.booking.property.title),
      html: frMail.email.newMessageHtml({
        recipientName: recipient.name,
        senderName: sender.name,
        propertyTitle: message.booking.property.title,
        preview,
        url: `${SITE_URL}/reservation/${message.bookingId}/messages`,
      }),
    });
  } catch (err) {
    // Non bloquant : le message est enregistré quoi qu'il arrive à l'e-mail.
    logStructured("error", "notif.new_message_failed", {
      messageId,
      error: (err as Error).message,
    });
  }
}
