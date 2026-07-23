/**
 * Défi « Hôte Zéro Faille » (GROWTH_ROADMAP.md §G4) : badge Super-Hôte,
 * calculé — jamais stocké (même philosophie que activeListingsLimit) — à
 * partir de la note moyenne BLENDED (avis + pénalité d'annulation hôte, cf.
 * blendedRatingStats / §AHC7) sur la fenêtre glissante
 * HOST_CANCELLATION_SIGNAL_DAYS, et du statut de suspension du compte.
 * Ouvert à HOTE et AGENCE (contrairement au boost offert d'abonnement MI4,
 * réservé AGENCE/Pro) : une annulation hôte fait déjà chuter la note
 * blended à elle seule, donc un critère d'annulation vérifié séparément
 * serait redondant.
 */

import { prisma } from "@/lib/prisma";
import { blendedRatingStats } from "@/lib/rating";
import {
  HOST_CANCELLATION_SIGNAL_DAYS,
  SUPER_HOST_MIN_RATING,
  SUPER_HOST_MIN_REVIEWS,
} from "@/lib/config";

function windowCutoff(): Date {
  return new Date(Date.now() - HOST_CANCELLATION_SIGNAL_DAYS * 24 * 60 * 60 * 1000);
}

export async function isSuperHost(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { suspended: true },
  });
  if (!user || user.suspended) return false;

  const cutoff = windowCutoff();
  const [reviews, cancellationCount] = await Promise.all([
    prisma.review.findMany({
      where: { property: { ownerId: userId }, createdAt: { gte: cutoff } },
      select: { rating: true },
    }),
    prisma.booking.count({
      where: { property: { ownerId: userId }, cancelledByHostAt: { gte: cutoff } },
    }),
  ]);

  if (reviews.length < SUPER_HOST_MIN_REVIEWS) return false;

  const { average } = blendedRatingStats(reviews, cancellationCount);
  return average >= SUPER_HOST_MIN_RATING;
}

/**
 * Une réclamation par fenêtre glissante — pas de concept de "cycle" ici
 * (contrairement à Subscription.freeBoostUsedAt, réservé aux abonnements
 * AGENCE) puisque HOTE n'a pas d'abonnement.
 */
export function superHostBoostClaimEligible(claimedAt: Date | null): boolean {
  if (!claimedAt) return true;
  return claimedAt.getTime() < windowCutoff().getTime();
}
