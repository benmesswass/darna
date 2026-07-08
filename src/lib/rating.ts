/**
 * Moyenne "affichée" d'une annonce, mélangeant les vrais avis voyageurs avec
 * les entrées système « annulé par l'hôte » (ANNULATION_HOTE_CORRECTIFS
 * _ROADMAP.md §AHC7, décision produit du 2026-07-08) : chaque annulation
 * hôte encore dans la fenêtre glissante compte comme une note automatique de
 * 1/5 dans le score AFFICHÉ (dissuasif réel, pas cosmétique). Volontairement
 * EXCLU des données structurées SEO (`src/lib/structured-data.ts`, JSON-LD
 * lu par Google) qui restent basées uniquement sur les vrais avis —
 * honnêteté du schema, aucune obligation Google là-dessus. Module pur (pas
 * d'import serveur) : utilisé aussi bien côté serveur (ListingDetail) que
 * côté client (ReviewsList).
 */
export const HOST_CANCELLATION_RATING = 1;

export function blendedRatingStats(
  reviews: { rating: number }[],
  cancellationCount: number
): { average: number; total: number; counts: number[] } {
  const counts = [0, 0, 0, 0, 0]; // index 0 → 1 étoile, index 4 → 5 étoiles
  let sum = 0;
  for (const r of reviews) {
    counts[r.rating - 1]++;
    sum += r.rating;
  }
  counts[HOST_CANCELLATION_RATING - 1] += cancellationCount;
  sum += cancellationCount * HOST_CANCELLATION_RATING;
  const total = reviews.length + cancellationCount;
  return { average: total ? sum / total : 0, total, counts };
}
