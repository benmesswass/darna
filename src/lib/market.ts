import { prisma } from "@/lib/prisma";
import { activeListingWhere } from "@/lib/listings";
import { cached } from "@/lib/cache";

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
