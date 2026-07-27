/**
 * Règlement d'un FeaturedOrder (achat de mise en avant « à la une » via
 * Konnect — MONETISATION_IMMO_ROADMAP.md §MI0). Miroir exact de
 * `src/lib/host-invoicing.ts` (`settleHostInvoice`) : logique partagée entre
 * le webhook dédié et la page de retour (`?konnect=success`).
 *
 * Pourquoi ne PAS être un server action ("use server") : même raison que
 * settleHostInvoice/settleKonnectBooking — jamais un endpoint RPC appelable
 * depuis le client. Vérifie le paiement auprès de Konnect (source de vérité)
 * puis applique l'effet métier (prolongation de `Property.featuredUntil`) de
 * façon idempotente.
 *
 * Module serveur uniquement (importe prisma + secrets Konnect).
 */

import { prisma } from "@/lib/prisma";
import { getKonnectPayment, tndToMillimes } from "@/lib/konnect";
import { FEATURED_DURATION_DAYS } from "@/lib/config";
import { logAudit, logStructured } from "@/lib/audit";
import { captureError } from "@/lib/observability";

export type SettleFeaturedResult =
  | "PAYEE" // réglé (effet appliqué ou déjà appliqué)
  | "EN_ATTENTE" // paiement pas encore abouti côté Konnect
  | "INTROUVABLE" // aucune commande pour cette référence
  | "ERREUR"; // échec technique ou montant incohérent

/**
 * Vérifie le statut Konnect d'un FeaturedOrder et prolonge le boost si le
 * paiement est abouti. Idempotent et sûr contre les courses (webhook vs
 * retour hôte) :
 *
 *  • Le règlement passe par un `updateMany` conditionné à `status: EN_ATTENTE`
 *    → une seule des deux requêtes concurrentes effectue réellement la
 *    mutation, et c'est CETTE requête (count === 1) qui applique l'extension
 *    de `featuredUntil` — jamais les deux.
 *  • Le montant reçu est revérifié côté serveur contre `FeaturedOrder.amount`
 *    (jamais de confiance au client ni au seul `payment_ref`).
 *  • Appeler avec une référence inconnue est inoffensif (INTROUVABLE).
 */
export async function settleFeaturedOrder(
  ref: { orderId: string } | { paymentRef: string }
): Promise<SettleFeaturedResult> {
  const order = await prisma.featuredOrder.findFirst({
    where: "orderId" in ref ? { id: ref.orderId } : { paymentRef: ref.paymentRef },
    select: {
      id: true,
      propertyId: true,
      ownerId: true,
      status: true,
      amount: true,
      paymentRef: true,
    },
  });

  if (!order) return "INTROUVABLE";

  // Idempotence : déjà réglé (webhook + retour hôte, ou double webhook).
  if (order.status === "PAYEE") return "PAYEE";
  // Paiement pas encore initialisé (aucun appel init-payment) → rien à vérifier.
  if (!order.paymentRef) return "EN_ATTENTE";

  let payment;
  try {
    payment = await getKonnectPayment(order.paymentRef);
  } catch (err) {
    logStructured("error", "konnect.featured_settle_fetch_failed", {
      orderId: order.id,
      error: (err as Error).message,
    });
    await captureError(err, { event: "konnect.featured_settle_fetch_failed", orderId: order.id });
    return "ERREUR";
  }

  // Pas encore payé (en attente / échoué). On ne touche à rien.
  if (payment.status !== "completed") return "EN_ATTENTE";

  // Contrôle d'intégrité : jamais de règlement si le montant réellement reçu
  // est inférieur au montant DÛ (FeaturedOrder.amount) — jamais un montant
  // client. Recalcul en millimes côté serveur.
  const expectedMillimes = tndToMillimes(order.amount);
  if (payment.reachedAmount < expectedMillimes) {
    logStructured("warn", "konnect.featured_amount_mismatch", {
      orderId: order.id,
      expectedMillimes,
      reachedAmount: payment.reachedAmount,
    });
    await captureError(new Error("konnect.featured_amount_mismatch"), {
      orderId: order.id,
      expectedMillimes,
      reachedAmount: payment.reachedAmount,
    });
    return "ERREUR";
  }

  // Règlement atomique : ne mute que si encore EN_ATTENTE. Si une requête
  // concurrente a déjà réglé, count === 0 → on retourne PAYEE sans réappliquer
  // l'extension du boost (sinon un même achat prolongerait deux fois).
  const updated = await prisma.featuredOrder.updateMany({
    where: { id: order.id, status: "EN_ATTENTE" },
    data: { status: "PAYEE", paidAt: new Date() },
  });
  if (updated.count === 0) return "PAYEE";

  // Effet métier — appliqué UNE SEULE FOIS (gagnant de la course ci-dessus) :
  // prolonge featuredUntil, cumulé depuis la fin de boost restante si future
  // (même logique que l'ancien featureListingAction, désormais réservée au
  // mode démo).
  const property = await prisma.property.findUnique({
    where: { id: order.propertyId },
    select: { featuredUntil: true },
  });
  const boostMs = FEATURED_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const base =
    property?.featuredUntil && property.featuredUntil.getTime() > Date.now()
      ? property.featuredUntil.getTime()
      : Date.now();
  const featuredUntil = new Date(base + boostMs);

  await prisma.property.update({
    where: { id: order.propertyId },
    data: { featuredUntil },
  });

  await logAudit({
    action: "PROPERTY_FEATURED",
    userId: order.ownerId,
    success: true,
    metadata: {
      propertyId: order.propertyId,
      orderId: order.id,
      amount: order.amount,
      featuredUntil: featuredUntil.toISOString(),
      provider: "konnect",
    },
  });

  return "PAYEE";
}
