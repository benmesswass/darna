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
