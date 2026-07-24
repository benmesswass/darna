/**
 * Score de complétude d'annonce (GROWTH_ROADMAP.md §G2) : dérivé — jamais
 * stocké, même philosophie que activeListingsLimit/isSuperHost — à partir de
 * 3 critères déjà présents sur Property (photos, description, équipements).
 * Sert deux usages : l'indicateur affiché sur /dashboard/annonces et la
 * relance paresseuse (ensureIncompleteListingNotifications).
 */

import {
  COMPLETENESS_MIN_AMENITIES,
  COMPLETENESS_MIN_DESCRIPTION_LENGTH,
  COMPLETENESS_MIN_PHOTOS,
} from "@/lib/config";

export type ListingCompleteness = {
  score: number;
  total: number;
  photosOk: boolean;
  descriptionOk: boolean;
  amenitiesOk: boolean;
};

function amenitiesCount(amenities: string): number {
  return amenities.split("|").filter((a) => a.trim().length > 0).length;
}

export function computeListingCompleteness(property: {
  photoCount: number;
  description: string;
  amenities: string;
}): ListingCompleteness {
  const photosOk = property.photoCount >= COMPLETENESS_MIN_PHOTOS;
  const descriptionOk = property.description.trim().length >= COMPLETENESS_MIN_DESCRIPTION_LENGTH;
  const amenitiesOk = amenitiesCount(property.amenities) >= COMPLETENESS_MIN_AMENITIES;

  const score = [photosOk, descriptionOk, amenitiesOk].filter(Boolean).length;
  return { score, total: 3, photosOk, descriptionOk, amenitiesOk };
}
