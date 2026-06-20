export type MapMarker = {
  id: string;
  slug: string;
  title: string;
  /** Libellé prix déjà formaté (ex. « 320 DT / nuit »). */
  priceLabel: string;
  /** Prix brut, pour le filtrage côté carte. */
  price: number;
  verified: boolean;
  latitude: number;
  longitude: number;
  /** Première photo de l'annonce — aperçu au survol. */
  imageUrl: string | null;
  /** Note moyenne (null si aucun avis). */
  rating: number | null;
  reviewCount: number;
  city: string;
};
