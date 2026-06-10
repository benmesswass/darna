import { prisma } from "@/lib/prisma";
import { activeListingWhere } from "@/lib/listings";
import { SUMMER_OCCUPANCY_RATE } from "@/lib/config";

export type YieldAnalysis = {
  /** Nuitée moyenne des séjours actifs de la ville (TND). */
  avgNightCity: number | null;
  nightSampleSize: number;
  /** Loyer mensuel moyen des locations actives du gouvernorat (TND). */
  avgRentGouvernorat: number | null;
  rentSampleSize: number;
  /** Revenu mensuel estimé en saisonnier : nuitée moyenne × 30 × 60 %. */
  saisonnierMensuel: number | null;
  /** Revenu mensuel en longue durée : loyer moyen du gouvernorat. */
  longueDureeMensuel: number | null;
  recommendation: "SAISONNIER" | "LONGUE_DUREE" | "EQUIVALENT" | "INSUFFISANT";
};

/**
 * Yield Advisor — comparaison saisonnier vs longue durée, calculée
 * uniquement depuis les données réelles de la plateforme.
 */
export async function computeYield(
  city: string,
  gouvernorat: string
): Promise<YieldAnalysis> {
  const [nightAgg, rentAgg] = await Promise.all([
    prisma.property.aggregate({
      where: { ...activeListingWhere(), type: "SEJOUR", city },
      _avg: { price: true },
      _count: { _all: true },
    }),
    prisma.property.aggregate({
      where: { ...activeListingWhere(), type: "LOCATION", gouvernorat },
      _avg: { price: true },
      _count: { _all: true },
    }),
  ]);

  const avgNightCity = nightAgg._avg.price ? Math.round(nightAgg._avg.price) : null;
  const avgRentGouvernorat = rentAgg._avg.price
    ? Math.round(rentAgg._avg.price)
    : null;

  const saisonnierMensuel = avgNightCity
    ? Math.round(avgNightCity * 30 * SUMMER_OCCUPANCY_RATE)
    : null;
  const longueDureeMensuel = avgRentGouvernorat;

  let recommendation: YieldAnalysis["recommendation"];
  if (!saisonnierMensuel || !longueDureeMensuel) {
    recommendation = "INSUFFISANT";
  } else {
    const ratio = saisonnierMensuel / longueDureeMensuel;
    recommendation =
      ratio >= 1.15 ? "SAISONNIER" : ratio <= 0.85 ? "LONGUE_DUREE" : "EQUIVALENT";
  }

  return {
    avgNightCity,
    nightSampleSize: nightAgg._count._all,
    avgRentGouvernorat,
    rentSampleSize: rentAgg._count._all,
    saisonnierMensuel,
    longueDureeMensuel,
    recommendation,
  };
}
