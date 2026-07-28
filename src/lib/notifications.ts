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
        amountPaid: true,
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
        amountPaid: formatTndServer(booking.amountPaid),
        balanceDue: formatTndServer(booking.totalPrice - booking.amountPaid),
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

/**
 * Envoie à l'HÔTE l'e-mail de nouvelle réservation ESCROW confirmée. Appelé
 * au même moment EXACT que sendBookingConfirmationEmail (voyageur) — mock
 * confirmPaymentAction ET webhook Konnect settleKonnectBooking — jamais lors
 * de l'acceptation d'une demande cash par l'hôte lui-même.
 */
export async function sendNewBookingHostEmail(bookingId: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        checkIn: true,
        checkOut: true,
        guests: true,
        guest: { select: { name: true } },
        property: {
          select: { title: true, owner: { select: { email: true, name: true } } },
        },
      },
    });

    if (!booking) {
      logStructured("warn", "notif.new_booking_host_not_found", { bookingId });
      return;
    }

    await sendEmail({
      to: booking.property.owner.email,
      subject: frMail.email.newBookingHostSujet(booking.property.title),
      html: frMail.email.newBookingHostHtml({
        hostName: booking.property.owner.name,
        guestName: booking.guest.name,
        propertyTitle: booking.property.title,
        checkIn: formatDateFr(booking.checkIn),
        checkOut: formatDateFr(booking.checkOut),
        guests: booking.guests,
        url: `${SITE_URL}/dashboard/reservations`,
      }),
    });
  } catch (err) {
    // Non bloquant : la réservation est confirmée quoi qu'il arrive à l'e-mail.
    logStructured("error", "notif.new_booking_host_failed", {
      bookingId,
      error: (err as Error).message,
    });
  }
}

/**
 * Envoie au VOYAGEUR l'e-mail d'annulation par l'hôte (ANNULATION_HOTE_CORRECTIFS
 * _ROADMAP.md §AHC4). Appelé APRÈS la transaction d'annulation, best-effort :
 * un échec d'envoi ne remet jamais en cause l'annulation déjà actée. Cible
 * diaspora : la perte du logement doit sortir de l'app (réservation faite des
 * mois à l'avance, app pas consultée quotidiennement). `refundAmount` est lu en
 * base (posé dans la transaction, §AHC1) — nul/0 en Rail 2 SUR_PLACE.
 */
export async function sendBookingCancelledByHostEmail(bookingId: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        refundAmount: true,
        guest: { select: { email: true, name: true } },
        property: { select: { title: true } },
      },
    });

    if (!booking) {
      logStructured("warn", "notif.host_cancel_not_found", { bookingId });
      return;
    }

    await sendEmail({
      to: booking.guest.email,
      subject: frMail.email.bookingCancelledByHostSujet(booking.property.title),
      html: frMail.email.bookingCancelledByHostHtml({
        guestName: booking.guest.name,
        propertyTitle: booking.property.title,
        refund:
          booking.refundAmount && booking.refundAmount > 0
            ? formatTndServer(booking.refundAmount)
            : null,
        url: `${SITE_URL}/relogement/${bookingId}`,
      }),
    });
  } catch (err) {
    // Non bloquant : l'annulation est actée quoi qu'il arrive à l'e-mail.
    logStructured("error", "notif.host_cancel_failed", {
      bookingId,
      error: (err as Error).message,
    });
  }
}

/**
 * Relance une réservation abandonnée (LANCEMENT_ROADMAP.md §L3.3 /
 * GROWTH_ROADMAP.md §G6) — appelée par le job
 * src/lib/jobs/booking-abandon-reminder.ts, jamais par une action utilisateur.
 */
export async function sendBookingAbandonReminderEmail(bookingId: string, url: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        guest: { select: { email: true, name: true } },
        property: { select: { title: true } },
      },
    });

    if (!booking) {
      logStructured("warn", "notif.booking_abandon_reminder_not_found", { bookingId });
      return;
    }

    await sendEmail({
      to: booking.guest.email,
      subject: frMail.email.bookingAbandonReminderSujet(booking.property.title),
      html: frMail.email.bookingAbandonReminderHtml({
        guestName: booking.guest.name,
        propertyTitle: booking.property.title,
        url,
      }),
    });
  } catch (err) {
    logStructured("error", "notif.booking_abandon_reminder_failed", {
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

/**
 * E-mail envoyé à la GÉNÉRATION d'une HostInvoice — au moment où l'hôte
 * accepte une demande de réservation Rail 2 (LANCEMENT_ROADMAP.md §L5.7,
 * `acceptCashBookingAction`). Distinct des rappels (avant échéance / retard) :
 * celui-ci part une seule fois, dès que la facture existe.
 */
export async function sendHostInvoiceGeneratedEmail(invoiceId: string): Promise<void> {
  try {
    const invoice = await prisma.hostInvoice.findUnique({
      where: { id: invoiceId },
      select: {
        amount: true,
        dueAt: true,
        host: { select: { name: true, email: true } },
        booking: { select: { property: { select: { title: true } } } },
      },
    });

    if (!invoice) {
      logStructured("warn", "notif.host_invoice_generated_not_found", { invoiceId });
      return;
    }

    await sendEmail({
      to: invoice.host.email,
      subject: frMail.email.hostInvoiceGeneratedSujet(invoice.booking.property.title),
      html: frMail.email.hostInvoiceGeneratedHtml({
        hostName: invoice.host.name,
        propertyTitle: invoice.booking.property.title,
        amount: formatTndServer(invoice.amount),
        dueDate: formatDateFr(invoice.dueAt),
        url: `${SITE_URL}/dashboard/factures/${invoiceId}`,
      }),
    });
  } catch (err) {
    logStructured("error", "notif.host_invoice_generated_failed", {
      invoiceId,
      error: (err as Error).message,
    });
  }
}

/**
 * Relance MANUELLE (dashboard admin factures — PAIEMENT_SUR_PLACE_ROADMAP.md
 * §PSP8) d'un hôte pour une HostInvoice impayée. Déclenchée par un admin,
 * jamais par un job planifié.
 */
export async function sendHostInvoiceReminderEmail(invoiceId: string): Promise<void> {
  try {
    const invoice = await prisma.hostInvoice.findUnique({
      where: { id: invoiceId },
      select: {
        amount: true,
        dueAt: true,
        host: { select: { name: true, email: true } },
        booking: { select: { property: { select: { title: true } } } },
      },
    });

    if (!invoice) {
      logStructured("warn", "notif.host_invoice_reminder_not_found", { invoiceId });
      return;
    }

    await sendEmail({
      to: invoice.host.email,
      subject: frMail.email.hostInvoiceReminderSujet(invoice.booking.property.title),
      html: frMail.email.hostInvoiceReminderHtml({
        hostName: invoice.host.name,
        propertyTitle: invoice.booking.property.title,
        amount: formatTndServer(invoice.amount),
        dueDate: formatDateFr(invoice.dueAt),
        url: `${SITE_URL}/dashboard/factures/${invoiceId}`,
      }),
    });
  } catch (err) {
    // Non bloquant : la relance admin ne doit jamais planter sur un échec d'e-mail.
    logStructured("error", "notif.host_invoice_reminder_failed", {
      invoiceId,
      error: (err as Error).message,
    });
  }
}

/**
 * Rappel AUTOMATIQUE (détection paresseuse, §PSP5) qu'une HostInvoice arrive
 * bientôt à échéance — distinct de sendHostInvoiceReminderEmail (relance
 * MANUELLE admin, §PSP8). Appelée depuis ensureHostInvoiceReminders
 * uniquement quand une notif in-app vient d'être créée (jamais de doublon).
 */
export async function sendHostInvoiceDueSoonEmail(invoiceId: string): Promise<void> {
  try {
    const invoice = await prisma.hostInvoice.findUnique({
      where: { id: invoiceId },
      select: {
        amount: true,
        dueAt: true,
        host: { select: { name: true, email: true } },
        booking: { select: { property: { select: { title: true } } } },
      },
    });
    if (!invoice) return;

    await sendEmail({
      to: invoice.host.email,
      subject: frMail.email.hostInvoiceDueSoonSujet(invoice.booking.property.title),
      html: frMail.email.hostInvoiceDueSoonHtml({
        hostName: invoice.host.name,
        propertyTitle: invoice.booking.property.title,
        amount: formatTndServer(invoice.amount),
        dueDate: formatDateFr(invoice.dueAt),
        url: `${SITE_URL}/dashboard/factures/${invoiceId}`,
      }),
    });
  } catch (err) {
    logStructured("error", "notif.host_invoice_due_soon_failed", {
      invoiceId,
      error: (err as Error).message,
    });
  }
}

/**
 * Rappel AUTOMATIQUE (détection paresseuse, §PSP5) qu'une HostInvoice a
 * dépassé son échéance — même garde anti-doublon que sendHostInvoiceDueSoonEmail.
 */
export async function sendHostInvoiceOverdueEmail(invoiceId: string): Promise<void> {
  try {
    const invoice = await prisma.hostInvoice.findUnique({
      where: { id: invoiceId },
      select: {
        amount: true,
        dueAt: true,
        host: { select: { name: true, email: true } },
        booking: { select: { property: { select: { title: true } } } },
      },
    });
    if (!invoice) return;

    await sendEmail({
      to: invoice.host.email,
      subject: frMail.email.hostInvoiceOverdueSujet(invoice.booking.property.title),
      html: frMail.email.hostInvoiceOverdueHtml({
        hostName: invoice.host.name,
        propertyTitle: invoice.booking.property.title,
        amount: formatTndServer(invoice.amount),
        dueDate: formatDateFr(invoice.dueAt),
        url: `${SITE_URL}/dashboard/factures/${invoiceId}`,
      }),
    });
  } catch (err) {
    logStructured("error", "notif.host_invoice_overdue_failed", {
      invoiceId,
      error: (err as Error).message,
    });
  }
}
