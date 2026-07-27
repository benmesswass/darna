import { prisma } from "@/lib/prisma";
import { logStructured } from "@/lib/audit";
import { captureError } from "@/lib/observability";
import { settleKonnectBooking } from "@/lib/payments";
import { settleHostInvoice } from "@/lib/host-invoicing";
import { settleFeaturedOrder } from "@/lib/featured-payments";
import { settleSubscriptionPayment } from "@/lib/subscription-payments";
import { settleVerificationCreditOrder } from "@/lib/verification-credit-payments";
import { PAYMENT_RECONCILIATION_STALE_MINUTES } from "@/lib/config";

/**
 * Job de réconciliation Konnect↔local (LANCEMENT_ROADMAP.md §L3.2) — garantie
 * "zéro perte de fonds" : détecte les paiements Konnect aboutis dont le
 * webhook (et le filet de sécurité de la page de retour) n'a jamais mis à
 * jour l'état local, et les rattrape via les settlements idempotents
 * EXISTANTS (jamais de nouveau code de règlement, jamais de webhook touché).
 *
 * Chaque entité a une requête "en attente depuis trop longtemps" adaptée à
 * son modèle, puis délègue entièrement au settle* correspondant — qui revérifie
 * lui-même le statut ET le montant auprès de Konnect avant tout effet. Un
 * settle* qui renvoie "toujours en attente" est un résultat normal (le
 * paiement n'a simplement pas encore abouti côté Konnect) ; seul un résultat
 * "payé" pour un enregistrement encore local-en-attente est un DRIFT rattrapé
 * (log warn) ; un résultat ERREUR (montant incohérent, appel Konnect en échec)
 * part en alerte observabilité pour investigation humaine.
 */

const staleSince = () =>
  new Date(Date.now() - PAYMENT_RECONCILIATION_STALE_MINUTES * 60_000);

type EntitySummary = { checked: number; caught: number };

async function reconcileEntity<TResult extends string>(params: {
  entity: string;
  ids: string[];
  settle: (id: string) => Promise<TResult>;
  paidResults: readonly TResult[];
  errorResult: TResult;
}): Promise<EntitySummary> {
  let caught = 0;
  for (const id of params.ids) {
    const result = await params.settle(id);
    if (params.paidResults.includes(result)) {
      logStructured("warn", "reconciliation.drift_caught", {
        entity: params.entity,
        id,
        result,
      });
      caught++;
    } else if (result === params.errorResult) {
      await captureError(new Error(`Konnect reconciliation: ${params.entity} settlement failed`), {
        entity: params.entity,
        id,
        result,
      });
    }
    // Sinon (toujours en attente / introuvable / déjà traité autrement) :
    // rien à signaler, comportement normal.
  }
  return { checked: params.ids.length, caught };
}

export async function reconcileKonnectPayments(): Promise<Record<string, EntitySummary>> {
  const summary: Record<string, EntitySummary> = {};

  const entities: Array<{
    name: string;
    fetch: () => Promise<string[]>;
    reconcile: (ids: string[]) => Promise<EntitySummary>;
  }> = [
    {
      name: "Booking",
      fetch: async () =>
        (
          await prisma.booking.findMany({
            where: { status: "EN_ATTENTE", paymentRef: { not: null }, createdAt: { lt: staleSince() } },
            select: { id: true },
          })
        ).map((r) => r.id),
      reconcile: (ids) =>
        reconcileEntity({
          entity: "Booking",
          ids,
          settle: (bookingId) => settleKonnectBooking({ bookingId }),
          paidResults: ["CONFIRMEE"],
          errorResult: "ERREUR",
        }),
    },
    {
      name: "HostInvoice",
      fetch: async () =>
        (
          await prisma.hostInvoice.findMany({
            where: { status: "EN_ATTENTE", paymentRef: { not: null }, createdAt: { lt: staleSince() } },
            select: { id: true },
          })
        ).map((r) => r.id),
      reconcile: (ids) =>
        reconcileEntity({
          entity: "HostInvoice",
          ids,
          settle: (invoiceId) => settleHostInvoice({ invoiceId }),
          paidResults: ["PAYEE"],
          errorResult: "ERREUR",
        }),
    },
    {
      name: "FeaturedOrder",
      fetch: async () =>
        (
          await prisma.featuredOrder.findMany({
            where: { status: "EN_ATTENTE", paymentRef: { not: null }, createdAt: { lt: staleSince() } },
            select: { id: true },
          })
        ).map((r) => r.id),
      reconcile: (ids) =>
        reconcileEntity({
          entity: "FeaturedOrder",
          ids,
          settle: (orderId) => settleFeaturedOrder({ orderId }),
          paidResults: ["PAYEE"],
          errorResult: "ERREUR",
        }),
    },
    {
      name: "VerificationCreditOrder",
      fetch: async () =>
        (
          await prisma.verificationCreditOrder.findMany({
            where: { status: "EN_ATTENTE", paymentRef: { not: null }, createdAt: { lt: staleSince() } },
            select: { id: true },
          })
        ).map((r) => r.id),
      reconcile: (ids) =>
        reconcileEntity({
          entity: "VerificationCreditOrder",
          ids,
          settle: (orderId) => settleVerificationCreditOrder({ orderId }),
          paidResults: ["PAYEE"],
          errorResult: "ERREUR",
        }),
    },
    {
      // Subscription est une ligne UNIQUE réutilisée à chaque cycle (pas une
      // ligne par paiement) : `status` peut déjà valoir ACTIF pendant qu'un
      // RENOUVELLEMENT est en cours (paymentRef non null). La clé de
      // réconciliation est donc `paymentRef`, pas `status` — cf. le
      // commentaire de settleSubscriptionPayment. Pas de filtre "depuis plus
      // de 30 min" ici : `createdAt` date de la création du compte, pas du
      // paiement en cours, donc inutilisable comme proxy — settle* reste
      // idempotent et sans effet si le paiement Konnect n'est pas encore
      // abouti, donc revérifier un peu plus souvent que le seuil des autres
      // entités est sans risque, juste un appel Konnect de plus.
      name: "Subscription",
      fetch: async () =>
        (
          await prisma.subscription.findMany({
            where: { paymentRef: { not: null } },
            select: { id: true },
          })
        ).map((r) => r.id),
      reconcile: (ids) =>
        reconcileEntity({
          entity: "Subscription",
          ids,
          settle: (subscriptionId) => settleSubscriptionPayment({ subscriptionId }),
          paidResults: ["ACTIF"],
          errorResult: "ERREUR",
        }),
    },
  ];

  for (const entity of entities) {
    try {
      const ids = await entity.fetch();
      summary[entity.name] = await entity.reconcile(ids);
    } catch (err) {
      // Un échec sur une entité (ex. base indisponible ponctuellement)
      // n'empêche pas de vérifier les autres.
      await captureError(err, { entity: entity.name, phase: "reconciliation" });
      summary[entity.name] = { checked: 0, caught: 0 };
    }
  }

  return summary;
}
