/**
 * Aperçu « inspiration » d'une destination, affiché dans la modale de recherche
 * (colonne de droite). Objectif produit : garder le voyageur sur Darna et le
 * pousser à finir sa recherche — météo, logements réellement disponibles,
 * recommandations cliquables, et alternatives proches pour ne jamais être dans
 * un cul-de-sac.
 *
 * Module SERVEUR uniquement (Prisma + météo). Exposé au client via la server
 * action `destinationPreviewAction`. Renvoie un DTO entièrement sérialisable
 * (pas d'objets Prisma ni de Date bruts).
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveCity, nearbyCities } from "@/lib/geo";
import { markerPriceLabel } from "@/lib/format";
import { activeListingWhere, clearExpiredFeatured } from "@/lib/listings";
import { getCityWeather, type CityWeather } from "@/lib/weather";

export type DestinationReco = {
  slug: string;
  title: string;
  priceLabel: string;
  city: string;
  verified: boolean;
  imageUrl: string | null;
};

export type DestinationAlternative = { city: string; count: number };

export type DestinationPreview = {
  /** Ville canonique résolue, ou null si saisie vide/inconnue. */
  resolvedCity: string | null;
  weather: CityWeather | null;
  /** Logements disponibles dans la ville résolue (0 si aucune/inconnue). */
  availableCount: number;
  recommendations: DestinationReco[];
  /** Villes alternatives + compteurs (proches si ville résolue, sinon populaires). */
  alternatives: DestinationAlternative[];
};

export type DestinationParams = {
  ville?: string;
  arrivee?: string;
  depart?: string;
  voyageurs?: string;
};

const RECO_TAKE = 3;
const ALT_TAKE = 3;

const recoSelect = {
  slug: true,
  title: true,
  price: true,
  type: true,
  city: true,
  verified: true,
  photos: { orderBy: { position: "asc" as const }, take: 1, select: { url: true } },
} satisfies Prisma.PropertySelect;

// Même tri que la recherche : à la une, puis vérifiées, puis récentes.
const recoOrderBy: Prisma.PropertyOrderByWithRelationInput[] = [
  { featuredUntil: { sort: "desc", nulls: "last" } },
  { verified: "desc" },
  { publishedAt: "desc" },
];

function parseDate(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parsePositiveInt(value?: string): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Contraintes hors-ville (séjour actif + capacité + disponibilité aux dates) —
 * identiques à `searchSejours` pour que les compteurs « dispo » soient honnêtes
 * (jamais une ville annoncée pleine qui s'avère vide au clic).
 */
function stayBaseWhere(params: DestinationParams): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = { ...activeListingWhere(), type: "SEJOUR" };
  const voyageurs = parsePositiveInt(params.voyageurs);
  if (voyageurs) where.stay = { maxGuests: { gte: voyageurs } };
  const arrivee = parseDate(params.arrivee);
  const depart = parseDate(params.depart);
  if (arrivee && depart && depart > arrivee) {
    where.NOT = {
      OR: [
        {
          bookings: {
            some: { status: "CONFIRMEE", checkIn: { lt: depart }, checkOut: { gt: arrivee } },
          },
        },
        { availabilities: { some: { startDate: { lt: depart }, endDate: { gt: arrivee } } } },
      ],
    };
  }
  return where;
}

function toReco(p: {
  slug: string;
  title: string;
  price: number;
  type: string;
  city: string;
  verified: boolean;
  photos: { url: string }[];
}): DestinationReco {
  return {
    slug: p.slug,
    title: p.title,
    priceLabel: markerPriceLabel(p.price, p.type),
    city: p.city,
    verified: p.verified,
    imageUrl: p.photos[0]?.url ?? null,
  };
}

async function sampleRecos(
  where: Prisma.PropertyWhereInput,
  take = RECO_TAKE
): Promise<DestinationReco[]> {
  const rows = await prisma.property.findMany({
    where,
    select: recoSelect,
    orderBy: recoOrderBy,
    take,
  });
  return rows.map(toReco);
}

/** Compteurs d'annonces dispo pour un jeu de villes (chips alternatives). */
async function alternativesFor(
  baseWhere: Prisma.PropertyWhereInput,
  cities: string[]
): Promise<DestinationAlternative[]> {
  if (!cities.length) return [];
  const grouped = await prisma.property.groupBy({
    by: ["city"],
    where: { ...baseWhere, city: { in: cities } },
    _count: { city: true },
  });
  return grouped
    .map((g) => ({ city: g.city, count: g._count.city }))
    .filter((a) => a.count > 0)
    .sort((a, b) => cities.indexOf(a.city) - cities.indexOf(b.city))
    .slice(0, ALT_TAKE);
}

export async function getDestinationPreview(
  params: DestinationParams
): Promise<DestinationPreview> {
  await clearExpiredFeatured();
  const baseWhere = stayBaseWhere(params);

  const resolvedCity = params.ville?.trim() ? resolveCity(params.ville) : null;

  // Aucune ville (vide ou inconnue) → état « inspiration » : destinations les
  // plus pourvues + un échantillon national pour donner envie d'explorer.
  if (!resolvedCity) {
    const popular = await prisma.property.groupBy({
      by: ["city"],
      where: baseWhere,
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: ALT_TAKE,
    });
    const alternatives = popular
      .map((g) => ({ city: g.city, count: g._count.city }))
      .filter((a) => a.count > 0);
    const recommendations = await sampleRecos({ ...baseWhere, verified: true });
    return { resolvedCity: null, weather: null, availableCount: 0, recommendations, alternatives };
  }

  const cityWhere = { ...baseWhere, city: resolvedCity };
  const nearbyNames = nearbyCities(resolvedCity).map((c) => c.name);

  const [weather, availableCount, cityRecos, alternatives] = await Promise.all([
    getCityWeather(resolvedCity),
    prisma.property.count({ where: cityWhere }),
    sampleRecos(cityWhere),
    alternativesFor(baseWhere, nearbyNames),
  ]);

  // Ville résolue mais vide → on remplit avec les recommandations des villes
  // proches plutôt que de laisser un panneau vide (anti-abandon).
  const recommendations =
    cityRecos.length > 0
      ? cityRecos
      : await sampleRecos({ ...baseWhere, city: { in: nearbyNames } });

  return { resolvedCity, weather, availableCount, recommendations, alternatives };
}
