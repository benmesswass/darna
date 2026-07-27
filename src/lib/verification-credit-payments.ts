/**
 * Règlement d'un achat de lot de crédits de vérification Wakil via Konnect
 * (MONETISATION_IMMO_ROADMAP.md §MI3). Miroir exact de
 * src/lib/featured-payments.ts (settleFeaturedOrder) : une ligne PAR ACHAT
 * (VerificationCreditOrder, contrairement à Subscription), idempotence via
 * transition de statut EN_ATTENTE→PAYEE (updateMany conditionné).
 *
 * Pourquoi ne PAS être un server action ("use server") : même raison que
 * settleFeaturedOrder — jamais un endpoint RPC appelable depuis le client.
 * Vérifie le paiement auprès de Konnect (source de vérité) puis crédite
 * VerificationWallet.balance de façon idempotente.
 *
 * Module serveur uniquement (importe prisma + secrets Konnect).
 */

import { prisma } from "@/lib/prisma";
import { getKonnectPayment, tndToMillimes } from "@/lib/konnect";
import { FREE_VERIFICATION_CREDITS } from "@/lib/config";
import { logAudit, logStructured } from "@/lib/audit";
import { captureError } from "@/lib/observability";

export type SettleVerificationCreditResult =
  | "PAYEE" // réglé (crédit appliqué ou déjà appliqué)
  | "EN_ATTENTE" // paiement pas encore aboutit côté Konnect
  | "INTROUVABLE" // aucune commande pour cette référence
  | "ERREUR"; // échec technique ou montant incohérent

/**
 * Vérifie le statut Konnect d'un VerificationCreditOrder et crédite le solde
 * si le paiement est abouti. Idempotent et sûr contre les courses (webhook vs
 * retour agence) :
 *
 *  • Le règlement passe par un `updateMany` conditionné à `status: EN_ATTENTE`
 *    → une seule des deux requêtes concurrentes effectue réellement la
 *    mutation, et c'est CETTE requête (count === 1) qui crédite le solde —
 *    jamais les deux.
 *  • Le montant reçu est revérifié côté serveur contre
 *    `VerificationCreditOrder.amount` (jamais de confiance au client).
 *  • Appeler avec une référence inconnue est inoffensif (INTROUVABLE).
 */
export async function settleVerificationCreditOrder(
  ref: { orderId: string } | { paymentRef: string }
): Promise<SettleVerificationCreditResult> {
  const order = await prisma.verificationCreditOrder.findFirst({
    where: "orderId" in ref ? { id: ref.orderId } : { paymentRef: ref.paymentRef },
    select: {
      id: true,
      ownerId: true,
      credits: true,
      amount: true,
      status: true,
      paymentRef: true,
    },
  });

  if (!order) return "INTROUVABLE";

  // Idempotence : déjà réglé (webhook + retour agence, ou double webhook).
  if (order.status === "PAYEE") return "PAYEE";
  // Paiement pas encore initialisé (aucun appel init-payment) → rien à vérifier.
  if (!order.paymentRef) return "EN_ATTENTE";

  let payment;
  try {
    payment = await getKonnectPayment(order.paymentRef);
  } catch (err) {
    logStructured("error", "konnect.verification_credit_settle_fetch_failed", {
      orderId: order.id,
      error: (err as Error).message,
    });
    await captureError(err, {
      event: "konnect.verification_credit_settle_fetch_failed",
      orderId: order.id,
    });
    return "ERREUR";
  }

  // Pas encore payé (en attente / échoué). On ne touche à rien.
  if (payment.status !== "completed") return "EN_ATTENTE";

  // Contrôle d'intégrité : jamais de crédit si le montant réellement reçu est
  // inférieur au montant DÛ (VerificationCreditOrder.amount) — jamais un
  // montant client. Recalcul en millimes côté serveur.
  const expectedMillimes = tndToMillimes(order.amount);
  if (payment.reachedAmount < expectedMillimes) {
    logStructured("warn", "konnect.verification_credit_amount_mismatch", {
      orderId: order.id,
      expectedMillimes,
      reachedAmount: payment.reachedAmount,
    });
    await captureError(new Error("konnect.verification_credit_amount_mismatch"), {
      orderId: order.id,
      expectedMillimes,
      reachedAmount: payment.reachedAmount,
    });
    return "ERREUR";
  }

  // Règlement atomique : ne mute que si encore EN_ATTENTE. Si une requête
  // concurrente a déjà réglé, count === 0 → on retourne PAYEE sans recréditer
  // le solde (sinon un même achat créditerait deux fois).
  const updated = await prisma.verificationCreditOrder.updateMany({
    where: { id: order.id, status: "EN_ATTENTE" },
    data: { status: "PAYEE", paidAt: new Date() },
  });
  if (updated.count === 0) return "PAYEE";

  // Effet métier — appliqué UNE SEULE FOIS (gagnant de la course ci-dessus) :
  // crédite le solde. Matérialise la ligne VerificationWallet au solde
  // gratuit initial si elle n'existe pas encore (achat comme tout premier
  // événement, aucune vérification consommée avant).
  await prisma.verificationWallet.upsert({
    where: { userId: order.ownerId },
    create: { userId: order.ownerId, balance: FREE_VERIFICATION_CREDITS + order.credits },
    update: { balance: { increment: order.credits } },
  });

  await logAudit({
    action: "VERIFICATION_CREDIT_PURCHASED",
    userId: order.ownerId,
    success: true,
    metadata: {
      orderId: order.id,
      credits: order.credits,
      amount: order.amount,
      provider: "konnect",
    },
  });

  return "PAYEE";
}
