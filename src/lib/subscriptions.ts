/**
 * Abonnement agence (MONETISATION_IMMO_ROADMAP.md §MI1/MI2) : dérive la
 * limite d'annonces actives applicable à un compte, à partir de son rôle et
 * de son `Subscription` éventuel. Aucune écriture ici (lecture pure) —
 * l'écriture (souscription/renouvellement) vit dans
 * src/actions/subscriptions.ts + src/lib/subscription-payments.ts.
 */

import { prisma } from "@/lib/prisma";
import { AGENCY_PLANS, type AgencyPlanKey } from "@/lib/constants";
import { FREE_TIER_LISTINGS_LIMIT } from "@/lib/config";

export function agencyPlan(key: string) {
  return AGENCY_PLANS.find((p) => p.key === key);
}

export function isAgencyPlanKey(key: string): key is AgencyPlanKey {
  return AGENCY_PLANS.some((p) => p.key === key);
}

type SubscriptionLike = {
  status: string;
  plan: string;
  currentPeriodEnd: Date | null;
} | null;

/**
 * Un abonnement compte comme ACTIF si son statut est ACTIF ET que la période
 * en cours n'est pas expirée. `EXPIRE` n'est volontairement pas un statut
 * stocké (cf. schema.prisma) : c'est ce calcul qui en tient lieu, comme pour
 * HostInvoice/Property.expiresAt ailleurs dans le projet.
 */
export function isSubscriptionActive(subscription: SubscriptionLike): boolean {
  if (!subscription || subscription.status !== "ACTIF") return false;
  return !subscription.currentPeriodEnd || subscription.currentPeriodEnd.getTime() > Date.now();
}

/**
 * Quota d'annonces ACTIVES autorisées. Le mécanisme d'abonnement ne cible que
 * les comptes AGENCE (cf. roadmap §MI1) — un compte HOTE n'est jamais limité.
 * Une agence sans abonnement ACTIF retombe sur le palier gratuit
 * (FREE_TIER_LISTINGS_LIMIT).
 */
export function activeListingsLimit(role: string, subscription: SubscriptionLike): number {
  if (role !== "AGENCE") return Infinity;
  if (isSubscriptionActive(subscription)) {
    const plan = agencyPlan(subscription!.plan);
    if (plan) return plan.listingsIncluded;
  }
  return FREE_TIER_LISTINGS_LIMIT;
}

/** Nombre d'annonces actuellement ACTIVES appartenant à cet utilisateur. */
export async function countActiveListings(ownerId: string): Promise<number> {
  return prisma.property.count({ where: { ownerId, status: "ACTIVE" } });
}

/**
 * Prix ramené à l'annonce active incluse (ex. 100 TND / 10 = 10 TND) —
 * cadrage honnête utilisé dans le pitch d'abonnement (page /dashboard/
 * abonnement), jamais un chiffre inventé.
 */
export function listingUnitCost(plan: { priceTND: number; listingsIncluded: number }): number {
  return Math.round((plan.priceTND / plan.listingsIncluded) * 10) / 10;
}

type SubscriptionWithBoostLike =
  | {
      status: string;
      plan: string;
      currentPeriodEnd: Date | null;
      freeBoostUsedAt: Date | null;
    }
  | null;

/**
 * Le palier de cet abonnement inclut-il un boost « à la une » offert par
 * cycle (MI4, décision Wassim du 2026-07-20 : palier Pro, 1/mois, NON
 * cumulable) — et n'a-t-il pas déjà été consommé pour le cycle en cours ?
 * Remis à zéro à chaque règlement (souscription ET renouvellement, cf.
 * settleSubscriptionPayment / subscribeAgencyPlanAction), jamais par un job.
 */
export function hasUnclaimedFreeBoost(subscription: SubscriptionWithBoostLike): boolean {
  if (!isSubscriptionActive(subscription)) return false;
  const plan = agencyPlan(subscription!.plan);
  return Boolean(plan?.freeBoostPerCycle) && !subscription!.freeBoostUsedAt;
}

/**
 * Palier le MOINS CHER qui couvrirait réellement ce nombre d'annonces actives
 * — recommandation concrète utilisée par la modale de quota atteint : jamais
 * un palier insuffisant pour le besoin réel (ex. recommander Starter à une
 * agence qui a déjà 11 annonces actives ne l'aiderait pas). Si aucun palier
 * n'est assez grand, retourne le plus grand disponible (meilleur possible).
 */
export function cheapestPlanForQuota(neededListings: number) {
  const sorted = [...AGENCY_PLANS].sort((a, b) => a.listingsIncluded - b.listingsIncluded);
  return sorted.find((p) => p.listingsIncluded >= neededListings) ?? sorted[sorted.length - 1];
}
