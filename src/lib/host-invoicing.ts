/**
 * Règlement d'une HostInvoice (commission Rail 2, paiement sur place —
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP4) via Konnect. Miroir exact de
 * `src/lib/payments.ts` (`settleKonnectBooking`) : logique partagée entre le
 * webhook dédié et la page de retour (`?konnect=success`).
 *
 * Pourquoi ne PAS être un server action ("use server") : même raison que
 * settleKonnectBooking — jamais un endpoint RPC appelable depuis le client.
 * Vérifie le paiement auprès de Konnect (source de vérité) et règle la
 * facture de façon idempotente.
 *
 * Module serveur uniquement (importe prisma + secrets Konnect).
 */

import { prisma } from "@/lib/prisma";
import { getKonnectPayment, tndToMillimes } from "@/lib/konnect";
import { logAudit, logStructured } from "@/lib/audit";

export type SettleInvoiceResult =
  | "PAYEE" // réglée
  | "EN_ATTENTE" // paiement pas encore abouti côté Konnect
  | "INTROUVABLE" // aucune facture pour cette référence
  | "ERREUR"; // échec technique ou montant incohérent

/**
 * Vérifie le statut Konnect d'une HostInvoice et la règle si le paiement est
 * abouti. Idempotent et sûr contre les courses (webhook vs retour hôte) :
 *
 *  • Le règlement passe par un `updateMany` conditionné à `status: EN_ATTENTE`
 *    → une seule des deux requêtes concurrentes effectue réellement la mutation.
 *  • Le montant reçu est revérifié côté serveur contre `HostInvoice.amount`
 *    (jamais de confiance au client ni au seul `payment_ref`).
 *  • Appeler avec une référence inconnue est inoffensif (INTROUVABLE).
 */
export async function settleHostInvoice(
  ref: { invoiceId: string } | { paymentRef: string }
): Promise<SettleInvoiceResult> {
  const invoice = await prisma.hostInvoice.findFirst({
    where: "invoiceId" in ref ? { id: ref.invoiceId } : { paymentRef: ref.paymentRef },
    select: { id: true, hostId: true, status: true, amount: true, paymentRef: true },
  });

  if (!invoice) return "INTROUVABLE";

  // Idempotence : déjà réglée (webhook + retour hôte, ou double webhook).
  if (invoice.status === "PAYEE") return "PAYEE";
  // Paiement pas encore initialisé (aucun appel init-payment) → rien à vérifier.
  if (!invoice.paymentRef) return "EN_ATTENTE";

  let payment;
  try {
    payment = await getKonnectPayment(invoice.paymentRef);
  } catch (err) {
    logStructured("error", "konnect.host_invoice_settle_fetch_failed", {
      invoiceId: invoice.id,
      error: (err as Error).message,
    });
    return "ERREUR";
  }

  // Pas encore payé (en attente / échoué). On ne touche pas à la facture.
  if (payment.status !== "completed") return "EN_ATTENTE";

  // Contrôle d'intégrité : jamais de règlement si le montant réellement reçu
  // est inférieur au montant DÛ (HostInvoice.amount) — jamais un montant
  // client. Recalcul en millimes côté serveur.
  const expectedMillimes = tndToMillimes(invoice.amount);
  if (payment.reachedAmount < expectedMillimes) {
    logStructured("warn", "konnect.host_invoice_amount_mismatch", {
      invoiceId: invoice.id,
      expectedMillimes,
      reachedAmount: payment.reachedAmount,
    });
    return "ERREUR";
  }

  // Règlement atomique : ne mute que si encore EN_ATTENTE. Si une requête
  // concurrente a déjà réglé, count === 0 → on retourne PAYEE sans re-logger.
  const updated = await prisma.hostInvoice.updateMany({
    where: { id: invoice.id, status: "EN_ATTENTE" },
    data: { status: "PAYEE", paidAt: new Date() },
  });
  if (updated.count === 0) return "PAYEE";

  await logAudit({
    action: "HOST_INVOICE_PAID",
    userId: invoice.hostId,
    success: true,
    metadata: {
      invoiceId: invoice.id,
      paymentRef: invoice.paymentRef,
      amount: invoice.amount,
      provider: "konnect",
    },
  });

  return "PAYEE";
}

/**
 * Levier de recouvrement (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP6) : un hôte a
 * au moins une HostInvoice EN_ATTENTE dont l'échéance est dépassée. AUCUN
 * champ stocké, aucun job planifié — filtre calculé à chaque lecture (même
 * esprit que `Property.expiresAt` / `activeListingWhere`). Dès que la
 * facture passe à PAYEE, la condition redevient fausse instantanément.
 */
export async function hasOverdueHostInvoice(hostId: string): Promise<boolean> {
  const count = await prisma.hostInvoice.count({
    where: { hostId, status: "EN_ATTENTE", dueAt: { lt: new Date() } },
  });
  return count > 0;
}
