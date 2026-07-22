/**
 * Règlement d'une réservation payée via Konnect — logique partagée entre le
 * webhook (serveur-à-serveur) et la page de retour (`?konnect=success`).
 *
 * Pourquoi ne PAS être un server action (`"use server"`) : on ne veut pas
 * exposer cette fonction comme endpoint RPC appelable depuis le client. Elle
 * vérifie le paiement auprès de Konnect (source de vérité) et confirme la
 * réservation de façon idempotente.
 *
 * Module serveur uniquement (importe prisma + secrets Konnect).
 */

import { prisma } from "@/lib/prisma";
import { getKonnectPayment, tndToMillimes } from "@/lib/konnect";
import { logAudit, logStructured } from "@/lib/audit";
import { sendBookingConfirmationEmail, sendNewBookingHostEmail } from "@/lib/notifications";
import { notifyBookingConfirmed, notifyNewBookingReceived } from "@/lib/notification-center";

export type SettleResult =
  | "CONFIRMEE" // payée et sous séquestre
  | "EN_ATTENTE" // paiement pas encore abouti côté Konnect
  | "ANNULEE" // réservation expirée / annulée
  | "INTROUVABLE" // aucune réservation pour cette référence
  | "ERREUR"; // échec technique ou montant incohérent

/**
 * Vérifie le statut Konnect d'une réservation et la confirme si le paiement
 * est abouti. Idempotent et sûr contre les courses (webhook vs retour user) :
 *
 *  • La confirmation passe par un `updateMany` conditionné à `status: EN_ATTENTE`
 *    → une seule des deux requêtes concurrentes effectue réellement la mutation.
 *  • Le montant reçu est revérifié côté serveur — jamais de confiance au client
 *    ni au seul `payment_ref`.
 *  • Appeler avec un `payment_ref` inconnu est inoffensif (INTROUVABLE).
 */
export async function settleKonnectBooking(
  ref: { bookingId: string } | { paymentRef: string }
): Promise<SettleResult> {
  const booking = await prisma.booking.findFirst({
    where: "bookingId" in ref ? { id: ref.bookingId } : { paymentRef: ref.paymentRef },
    select: {
      id: true,
      guestId: true,
      status: true,
      expiresAt: true,
      totalPrice: true,
      // Montant ATTENDU pour CE paiement (choix du voyageur, clampé et figé à
      // l'init côté serveur). Source de vérité de la vérif du montant reçu.
      amountPaid: true,
      paymentRef: true,
    },
  });

  if (!booking) return "INTROUVABLE";

  // Idempotence : déjà réglée (webhook + retour user, ou double webhook).
  if (booking.status === "CONFIRMEE" || booking.status === "TERMINEE") {
    return "CONFIRMEE";
  }
  // Déjà annulée / expirée : rien à régler.
  if (booking.status !== "EN_ATTENTE") return "ANNULEE";
  // Paiement pas encore initialisé (aucun appel init-payment) → rien à vérifier.
  if (!booking.paymentRef) return "EN_ATTENTE";

  let payment;
  try {
    payment = await getKonnectPayment(booking.paymentRef);
  } catch (err) {
    logStructured("error", "konnect.settle_fetch_failed", {
      bookingId: booking.id,
      error: (err as Error).message,
    });
    return "ERREUR";
  }

  // Pas encore payé (en attente / échoué). On ne touche pas à la réservation :
  // elle expirera naturellement si l'acheteur abandonne.
  if (payment.status !== "completed") return "EN_ATTENTE";

  // Contrôle d'intégrité : on ne confirme JAMAIS si le montant réellement reçu
  // est inférieur au montant ATTENDU pour ce paiement — le choix du voyageur
  // figé à l'init (amountPaid), PAS le total. Filet : si aucun montant attendu
  // n'a été mémorisé (cas anormal), on retombe sur le total dû. Recalcul en
  // millimes côté serveur.
  const expectedTND = booking.amountPaid > 0 ? booking.amountPaid : booking.totalPrice;
  const expectedMillimes = tndToMillimes(expectedTND);
  if (payment.reachedAmount < expectedMillimes) {
    logStructured("warn", "konnect.amount_mismatch", {
      bookingId: booking.id,
      expectedMillimes,
      reachedAmount: payment.reachedAmount,
    });
    return "ERREUR";
  }

  // Cas limite : payé après expiration du créneau (rendu indisponible). Le
  // lifespan Konnect est aligné sur l'expiration de la réservation, donc très
  // improbable — mais on annule et on journalise pour remboursement manuel
  // plutôt que de risquer une double-réservation.
  if (booking.expiresAt && booking.expiresAt < new Date()) {
    await prisma.booking.updateMany({
      where: { id: booking.id, status: "EN_ATTENTE" },
      data: { status: "ANNULEE" },
    });
    logStructured("warn", "konnect.paid_after_expiry", {
      bookingId: booking.id,
      paymentRef: booking.paymentRef,
    });
    return "ANNULEE";
  }

  // Confirmation atomique : ne mute que si encore EN_ATTENTE. Si une requête
  // concurrente a déjà confirmé, count === 0 → on retourne CONFIRMEE sans
  // re-logger ni re-déclencher d'effet de bord.
  const updated = await prisma.booking.updateMany({
    where: { id: booking.id, status: "EN_ATTENTE" },
    data: {
      status: "CONFIRMEE",
      escrow: "EN_SEQUESTRE",
      expiresAt: null,
      paidAt: new Date(),
    },
  });
  if (updated.count === 0) return "CONFIRMEE";

  await logAudit({
    action: "PAYMENT_CONFIRMED",
    userId: booking.guestId,
    success: true,
    metadata: {
      bookingId: booking.id,
      paymentRef: booking.paymentRef,
      amountPaid: expectedTND,
      totalPrice: booking.totalPrice,
      provider: "konnect",
    },
  });

  // Notification transactionnelle (non bloquante) : on ne l'envoie qu'ici,
  // après la transition réelle EN_ATTENTE → CONFIRMEE (count === 1), donc une
  // seule fois même si webhook et page de retour règlent en concurrence.
  await sendBookingConfirmationEmail(booking.id);
  await notifyBookingConfirmed(booking.id);
  await sendNewBookingHostEmail(booking.id);
  await notifyNewBookingReceived(booking.id);

  return "CONFIRMEE";
}
