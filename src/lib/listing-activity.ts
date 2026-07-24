import { prisma } from "@/lib/prisma";
import {
  LISTING_ACTIVITY_MIN_VIEWS,
  LISTING_ACTIVITY_RECENT_BOOKING_DAYS,
} from "@/lib/config";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ListingActivitySignal = {
  /** null = pas significatif (sous le seuil) → ne rien afficher. */
  viewCount: number | null;
  /** null = pas de réservation récente (ou verticale sans réservation) → ne rien afficher. */
  lastBookedDaysAgo: number | null;
};

/**
 * Signal de dynamique temps réel (GROWTH_ROADMAP.md §G5) — jamais de chiffre
 * gonflé : chaque compteur est masqué (`null`) tant qu'il n'est pas
 * significatif, plutôt que d'afficher un « 1 » ou une réservation trop
 * ancienne pour être un vrai signal d'activité.
 */
export function computeListingActivitySignal(input: {
  viewCount: number;
  lastBookedAt: Date | null;
}): ListingActivitySignal {
  const viewCount = input.viewCount >= LISTING_ACTIVITY_MIN_VIEWS ? input.viewCount : null;

  let lastBookedDaysAgo: number | null = null;
  if (input.lastBookedAt) {
    const days = Math.floor((Date.now() - input.lastBookedAt.getTime()) / DAY_MS);
    if (days >= 0 && days <= LISTING_ACTIVITY_RECENT_BOOKING_DAYS) {
      lastBookedDaysAgo = days;
    }
  }

  return { viewCount, lastBookedDaysAgo };
}

/**
 * Dernière réservation PAYÉE de l'annonce — n'a de sens que pour SEJOUR
 * (LOCATION/VENTE sont de la mise en relation, pas de réservation) ; laissé
 * au chargement de ne PAS appeler cette fonction hors SEJOUR plutôt que de
 * filtrer ici sur le type.
 */
export async function getLastConfirmedBookingDate(propertyId: string): Promise<Date | null> {
  const last = await prisma.booking.findFirst({
    where: { propertyId, status: { in: ["CONFIRMEE", "TERMINEE"] } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return last?.createdAt ?? null;
}
