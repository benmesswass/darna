import { prisma } from "@/lib/prisma";
import { activeListingWhere } from "@/lib/listings";
import { cached } from "@/lib/cache";
import { getCity } from "@/lib/geo";
import type { PropertyType } from "@/lib/constants";
import { SUMMER_OCCUPANCY_RATE, SIMULATOR_OCCUPANCY_LOW, SIMULATOR_ESTIMATE_BAND } from "@/lib/config";

export type M2Row = {
  label: string;
  avgPerM2: number;
  count: number;
};

export type NightRow = {
  label: string;
  avgNight: number;
  count: number;
};

/**
 * Indice Darna — agrégats server-side sur les annonces actives :
 * prix moyen au m² par gouvernorat (vente, location) et nuitée
 * moyenne par ville (séjours). Annonces sans surface exclues du m².
 */
export async function computeMarketIndex() {
  // Agrégat lourd et lent à changer → mémoïsé 5 min (Redis si REDIS_URL,
  // sinon cache in-memory par instance). Cf. src/lib/cache.ts.
  return cached("market:index", 300, computeMarketIndexRaw);
}

async function computeMarketIndexRaw() {
  const [withSurface, sejours] = await Promise.all([
    prisma.property.findMany({
      where: {
        ...activeListingWhere(),
        type: { in: ["VENTE", "LOCATION"] },
        surface: { not: null, gt: 0 },
      },
      select: { type: true, gouvernorat: true, price: true, surface: true },
    }),
    prisma.property.findMany({
      where: { ...activeListingWhere(), type: "SEJOUR" },
      select: { city: true, price: true },
    }),
  ]);

  function groupPerM2(type: "VENTE" | "LOCATION"): M2Row[] {
    const acc = new Map<string, { sum: number; count: number }>();
    for (const p of withSurface) {
      if (p.type !== type || !p.surface) continue;
      const entry = acc.get(p.gouvernorat) ?? { sum: 0, count: 0 };
      entry.sum += p.price / p.surface;
      entry.count += 1;
      acc.set(p.gouvernorat, entry);
    }
    return [...acc.entries()]
      .map(([label, { sum, count }]) => ({
        label,
        avgPerM2: Math.round(sum / count),
        count,
      }))
      .sort((a, b) => b.avgPerM2 - a.avgPerM2);
  }

  const nightAcc = new Map<string, { sum: number; count: number }>();
  for (const s of sejours) {
    const entry = nightAcc.get(s.city) ?? { sum: 0, count: 0 };
    entry.sum += s.price;
    entry.count += 1;
    nightAcc.set(s.city, entry);
  }
  const nights: NightRow[] = [...nightAcc.entries()]
    .map(([label, { sum, count }]) => ({
      label,
      avgNight: Math.round(sum / count),
      count,
    }))
    .sort((a, b) => b.avgNight - a.avgNight);

  return {
    vente: groupPerM2("VENTE"),
    location: groupPerM2("LOCATION"),
    nights,
  };
}

export type RevenueEstimateUnit = "NUITEE" | "LOYER_MENSUEL" | "PRIX_VENTE";

export type RevenueEstimate = {
  /** false si aucune donnée réelle pour cette ville/gouvernorat (ou surface manquante). */
  matched: boolean;
  sampleSize: number;
  monthlyLow: number | null;
  monthlyHigh: number | null;
  unit: RevenueEstimateUnit;
};

/**
 * Simulateur public de revenus (GROWTH_ROADMAP.md §G1) — fourchette dérivée
 * UNIQUEMENT de l'indice déjà calculé par computeMarketIndex() (mêmes agrégats
 * que /prix-du-marche, mémoïsés 5 min) : aucune nouvelle requête lourde.
 * `capacity` n'entre volontairement pas dans le calcul (l'indice n'est pas
 * ventilé par capacité) — jamais de chiffre gonflé par une hypothèse non
 * vérifiée ; la capacité saisie ne sert qu'à préremplir le CTA d'inscription.
 */
export async function estimateRevenue(input: {
  city: string;
  type: PropertyType;
  surface?: number;
}): Promise<RevenueEstimate> {
  const { vente, location, nights } = await computeMarketIndex();
  const unit: RevenueEstimateUnit =
    input.type === "SEJOUR"
      ? "NUITEE"
      : input.type === "LOCATION"
        ? "LOYER_MENSUEL"
        : "PRIX_VENTE";

  if (input.type === "SEJOUR") {
    const row = nights.find((n) => n.label === input.city);
    if (!row) {
      return { matched: false, sampleSize: 0, monthlyLow: null, monthlyHigh: null, unit };
    }
    return {
      matched: true,
      sampleSize: row.count,
      monthlyLow: Math.round(row.avgNight * 30 * SIMULATOR_OCCUPANCY_LOW),
      monthlyHigh: Math.round(row.avgNight * 30 * SUMMER_OCCUPANCY_RATE),
      unit,
    };
  }

  const gouvernorat = getCity(input.city)?.gouvernorat;
  const table = input.type === "LOCATION" ? location : vente;
  const row = gouvernorat ? table.find((r) => r.label === gouvernorat) : undefined;
  if (!row || !input.surface || input.surface <= 0) {
    return { matched: false, sampleSize: row?.count ?? 0, monthlyLow: null, monthlyHigh: null, unit };
  }

  const base = row.avgPerM2 * input.surface;
  return {
    matched: true,
    sampleSize: row.count,
    monthlyLow: Math.round(base * (1 - SIMULATOR_ESTIMATE_BAND)),
    monthlyHigh: Math.round(base * (1 + SIMULATOR_ESTIMATE_BAND)),
    unit,
  };
}
