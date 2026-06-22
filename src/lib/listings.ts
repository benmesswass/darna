import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveCity, nearbyCities } from "@/lib/geo";
import { markerPriceLabel } from "@/lib/format";
import type { MapMarker } from "@/components/map/types";

/** Taille de page pour les listings (protection DoS + UX). */
const PAGE_SIZE = 24;

/**
 * Fraîcheur des données : seules les annonces ACTIVE et non expirées
 * apparaissent dans les recherches — réponse structurelle aux annonces
 * périmées des concurrents.
 */
export function activeListingWhere(): Prisma.PropertyWhereInput {
  return { status: "ACTIVE", expiresAt: { gt: new Date() } };
}

/** Une annonce est « à la une » tant que son boost payé n'a pas expiré. */
export function isListingFeatured(featuredUntil: Date | null): boolean {
  return featuredUntil !== null && featuredUntil.getTime() > Date.now();
}

/**
 * Remet à null les boosts « à la une » expirés (même idiome d'expiration
 * paresseuse que les réservations EN_ATTENTE). Garantit que seules les
 * annonces réellement boostées portent un featuredUntil non-null, ce qui
 * rend le tri « à la une d'abord » exact sans SQL brut ni job cron.
 */
export async function clearExpiredFeatured(): Promise<void> {
  await prisma.property.updateMany({
    where: { featuredUntil: { lte: new Date() } },
    data: { featuredUntil: null },
  });
}

/**
 * Tri commun des listings : les annonces à la une d'abord (boost le plus
 * lointain en tête), puis vérifiées, puis les plus récentes. À utiliser
 * APRÈS clearExpiredFeatured() pour que featuredUntil non-null = boost actif.
 */
const listingOrderBy: Prisma.PropertyOrderByWithRelationInput[] = [
  { featuredUntil: { sort: "desc", nulls: "last" } },
  { verified: "desc" },
  { publishedAt: "desc" },
];

export const listingCardInclude = {
  photos: { orderBy: { position: "asc" as const }, take: 1 },
  // Capacité séjour lue depuis la table satellite (M2). maxGuests reste en
  // shadow sur Property jusqu'à PR8 ; la carte lit désormais stay.maxGuests.
  stay: { select: { maxGuests: true } },
  // Notes des avis : moyenne + nombre affichés sur la carte (survol marqueur).
  reviews: { select: { rating: true } },
} satisfies Prisma.PropertyInclude;

export type ListingWithPhoto = Prisma.PropertyGetPayload<{
  include: typeof listingCardInclude;
}>;

/** Construit les marqueurs carte (prix, photo, note, avis) depuis des résultats. */
export function toMapMarkers(results: ListingWithPhoto[]): MapMarker[] {
  return results.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    priceLabel: markerPriceLabel(p.price, p.type),
    price: p.price,
    verified: p.verified,
    latitude: p.latitude,
    longitude: p.longitude,
    imageUrl: p.photos[0]?.url ?? null,
    rating: p.reviews.length
      ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
      : null,
    reviewCount: p.reviews.length,
    city: p.city,
  }));
}

export type SejoursSearchParams = {
  ville?: string;
  arrivee?: string;
  depart?: string;
  voyageurs?: string;
  page?: string;
};

export type ImmobilierSearchParams = {
  transaction?: string;
  gouvernorat?: string;
  prixMin?: string;
  prixMax?: string;
  surfaceMin?: string;
  pieces?: string;
  page?: string;
};

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

function parsePage(value?: string): number {
  const n = parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Une suggestion d'élargissement : ville alternative + nombre d'annonces dispo. */
export type CitySuggestion = { city: string; count: number };
export type StaySuggestions = {
  /** `nearby` = villes proches de la ville cherchée ; `popular` = repli national. */
  kind: "nearby" | "popular";
  /** Villes alternatives + compteurs (chips « voir tout à X »). */
  cities: CitySuggestion[];
  /** Échantillon d'annonces réelles de ces villes, affiché directement. */
  listings: ListingWithPhoto[];
};

/** Taille de l'échantillon d'annonces montré dans le bandeau d'élargissement. */
const SUGGESTION_SAMPLE = 6;

/**
 * Quand une ville CONNUE ne renvoie aucune annonce, propose des alternatives
 * pour garder l'utilisateur sur le site plutôt que dans un cul-de-sac :
 *  1. villes proches (même gouvernorat puis distance) qui ont des annonces
 *     dispo avec LES MÊMES filtres (dates, voyageurs) — `nearby` ;
 *  2. à défaut, les destinations les plus pourvues du pays — `popular`.
 * On renvoie à la fois les compteurs par ville (chips) ET un échantillon
 * d'annonces réelles à afficher tout de suite. Tout est calculé avec les
 * filtres réels : on ne promet jamais une ville « pleine » qui s'avère vide
 * au clic (transparence = positionnement Darna).
 */
async function suggestStayAlternatives(
  resolvedCity: string,
  baseWhere: Prisma.PropertyWhereInput
): Promise<StaySuggestions | null> {
  const candidates = nearbyCities(resolvedCity).map((c) => c.name);
  if (candidates.length) {
    const grouped = await prisma.property.groupBy({
      by: ["city"],
      where: { ...baseWhere, city: { in: candidates } },
      _count: { city: true },
    });
    const nearby = grouped
      .map((g) => ({ city: g.city, count: g._count.city }))
      .filter((s) => s.count > 0)
      // Réordonne selon la proximité (groupBy ne garantit pas l'ordre).
      .sort((a, b) => candidates.indexOf(a.city) - candidates.indexOf(b.city))
      .slice(0, 3);
    if (nearby.length) {
      const listings = await sampleListings(baseWhere, nearby.map((c) => c.city));
      return { kind: "nearby", cities: nearby, listings };
    }
  }

  // Repli : destinations les plus pourvues, toutes régions confondues.
  const popular = await prisma.property.groupBy({
    by: ["city"],
    where: { ...baseWhere, city: { not: resolvedCity } },
    _count: { city: true },
    orderBy: { _count: { city: "desc" } },
    take: 3,
  });
  const cities = popular
    .map((g) => ({ city: g.city, count: g._count.city }))
    .filter((s) => s.count > 0);
  if (!cities.length) return null;
  const listings = await sampleListings(baseWhere, cities.map((c) => c.city));
  return { kind: "popular", cities, listings };
}

/** Échantillon d'annonces (même tri que la recherche) pour un jeu de villes. */
async function sampleListings(
  baseWhere: Prisma.PropertyWhereInput,
  cities: string[]
): Promise<ListingWithPhoto[]> {
  return prisma.property.findMany({
    where: { ...baseWhere, city: { in: cities } },
    include: listingCardInclude,
    orderBy: listingOrderBy,
    take: SUGGESTION_SAMPLE,
  });
}

export async function searchSejours(params: SejoursSearchParams) {
  await clearExpiredFeatured();

  // Contraintes hors-ville (capacité + disponibilité), réutilisées telles
  // quelles pour calculer les suggestions d'élargissement à filtres égaux.
  const baseWhere: Prisma.PropertyWhereInput = {
    ...activeListingWhere(),
    type: "SEJOUR",
  };

  // Filtre capacité sur la table satellite (M2) : un séjour matche s'il a une
  // ligne StayDetails dont maxGuests ≥ voyageurs (équivalent à l'ancien filtre
  // sur Property.maxGuests, les valeurs étant synchronisées en shadow).
  const voyageurs = parsePositiveInt(params.voyageurs);
  if (voyageurs) baseWhere.stay = { maxGuests: { gte: voyageurs } };

  const arrivee = parseDate(params.arrivee);
  const depart = parseDate(params.depart);
  if (arrivee && depart && depart > arrivee) {
    baseWhere.NOT = {
      OR: [
        {
          bookings: {
            some: {
              status: "CONFIRMEE",
              checkIn: { lt: depart },
              checkOut: { gt: arrivee },
            },
          },
        },
        {
          availabilities: {
            some: { startDate: { lt: depart }, endDate: { gt: arrivee } },
          },
        },
      ],
    };
  }

  // Recherche tolérante à la translittération (« 7ammamet » → Hammamet).
  let resolvedCity: string | null = null;
  let unknownCity = false;
  if (params.ville?.trim()) {
    resolvedCity = resolveCity(params.ville);
    if (!resolvedCity) unknownCity = true;
  }

  const page = parsePage(params.page);
  const skip = (page - 1) * PAGE_SIZE;

  if (unknownCity) {
    return {
      results: [],
      resolvedCity,
      unknownCity,
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      suggestions: null as StaySuggestions | null,
    };
  }

  const where: Prisma.PropertyWhereInput = resolvedCity
    ? { ...baseWhere, city: resolvedCity }
    : baseWhere;

  const [results, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: listingCardInclude,
      orderBy: listingOrderBy,
      take: PAGE_SIZE,
      skip,
    }),
    prisma.property.count({ where }),
  ]);

  // Ville connue mais aucune annonce → on propose un élargissement.
  const suggestions =
    resolvedCity && total === 0
      ? await suggestStayAlternatives(resolvedCity, baseWhere)
      : null;

  return { results, resolvedCity, unknownCity, total, page, pageSize: PAGE_SIZE, suggestions };
}

export async function searchImmobilier(params: ImmobilierSearchParams) {
  await clearExpiredFeatured();

  const transaction = params.transaction === "vente" ? "VENTE" : "LOCATION";

  const where: Prisma.PropertyWhereInput = {
    ...activeListingWhere(),
    type: transaction,
  };

  if (params.gouvernorat?.trim()) where.gouvernorat = params.gouvernorat.trim();

  const prixMin = parsePositiveInt(params.prixMin);
  const prixMax = parsePositiveInt(params.prixMax);
  if (prixMin || prixMax) {
    where.price = {
      ...(prixMin ? { gte: prixMin } : {}),
      ...(prixMax ? { lte: prixMax } : {}),
    };
  }

  const surfaceMin = parsePositiveInt(params.surfaceMin);
  if (surfaceMin) where.surface = { gte: surfaceMin };

  const pieces = parsePositiveInt(params.pieces);
  if (pieces) where.rooms = { gte: pieces };

  const page = parsePage(params.page);
  const skip = (page - 1) * PAGE_SIZE;

  const [results, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: listingCardInclude,
      orderBy: listingOrderBy,
      take: PAGE_SIZE,
      skip,
    }),
    prisma.property.count({ where }),
  ]);

  return { results, transaction, total, page, pageSize: PAGE_SIZE };
}

export async function getPropertyBySlug(slug: string) {
  return prisma.property.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { position: "asc" } },
      // Capacité séjour depuis la table satellite (M2).
      stay: { select: { maxGuests: true } },
      owner: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          kycStatus: true,
          createdAt: true,
        },
      },
      verifiedBy: { select: { name: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      availabilities: true,
      bookings: {
        where: { status: "CONFIRMEE", checkOut: { gte: new Date() } },
        select: { checkIn: true, checkOut: true },
      },
    },
  });
}

export async function getFeaturedListings(take = 6) {
  return prisma.property.findMany({
    where: { ...activeListingWhere(), verified: true },
    include: listingCardInclude,
    orderBy: { publishedAt: "desc" },
    take,
  });
}

/**
 * Annonces « à la une » (boost payé encore actif), pour le rail mis en avant
 * sur l'accueil. C'est la vitrine qui rend la mise en avant attractive pour
 * les hôtes. Le filtre featuredUntil > now suffit à exclure les boosts périmés.
 */
export async function getAlaUneListings(take = 4) {
  return prisma.property.findMany({
    where: { ...activeListingWhere(), featuredUntil: { gt: new Date() } },
    include: listingCardInclude,
    orderBy: { featuredUntil: "desc" },
    take,
  });
}

/** Nombre de jours depuis la publication (badge fraîcheur). */
export function daysSincePublication(publishedAt: Date): number {
  return Math.floor((Date.now() - publishedAt.getTime()) / (24 * 60 * 60 * 1000));
}

/** Liste des dates (AAAA-MM-JJ) indisponibles pour le calendrier. */
export function buildUnavailableDates(
  ranges: { start: Date; end: Date }[],
  horizonDays = 120
): string[] {
  const out = new Set<string>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  for (const { start, end } of ranges) {
    const cursor = new Date(Math.max(start.getTime(), today.getTime()));
    cursor.setHours(0, 0, 0, 0);
    while (cursor < end && cursor <= horizon) {
      out.add(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return [...out].sort();
}
