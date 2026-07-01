import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveCity, nearbyCities } from "@/lib/geo";
import { markerPriceLabel } from "@/lib/format";
import { parseSortKey, parseAmenitiesParam, type SortKey } from "@/lib/constants";
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
export const listingOrderBy: Prisma.PropertyOrderByWithRelationInput[] = [
  { featuredUntil: { sort: "desc", nulls: "last" } },
  { verified: "desc" },
  { publishedAt: "desc" },
];

/**
 * `orderBy` Prisma pour un tri utilisateur. `recommande` (défaut) conserve la
 * logique de mise en avant (listingOrderBy). Les tris explicites par prix /
 * récence priment sur la mise en avant — quand l'utilisateur choisit un ordre,
 * on le respecte (avec un tiebreak stable). Voir SEARCH_SORTS (constants.ts).
 */
function orderByForSort(sort: SortKey): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case "prix-asc":
      return [{ price: "asc" }, { publishedAt: "desc" }];
    case "prix-desc":
      return [{ price: "desc" }, { publishedAt: "desc" }];
    // Tri par note : les annonces SANS avis (ratingAvg null) sont reléguées en
    // fin dans LES DEUX sens (nulls: "last") — « aucun avis » n'est pas « mal noté ».
    case "avis-desc":
      return [{ ratingAvg: { sort: "desc", nulls: "last" } }, { ratingCount: "desc" }];
    case "avis-asc":
      return [{ ratingAvg: { sort: "asc", nulls: "last" } }, { ratingCount: "desc" }];
    case "recent":
      return [{ publishedAt: "desc" }];
    default:
      return listingOrderBy;
  }
}

/**
 * Filtre par niveau de vérification (cases à cocher de recherche). « Vérifié
 * Darna » = REMOTE ; « Certifié Wakil » = ON_SITE. Coché(s) → on restreint aux
 * niveaux sélectionnés ; rien coché → aucun filtre. verificationLevel non-null
 * implique verified=true (posés ensemble, cf. verifyPropertyAction).
 */
function verificationFilter(params: {
  verifie?: string;
  certifie?: string;
}): Prisma.PropertyWhereInput {
  const levels: string[] = [];
  if (params.verifie === "1") levels.push("REMOTE");
  if (params.certifie === "1") levels.push("ON_SITE");
  return levels.length ? { verificationLevel: { in: levels } } : {};
}

/**
 * Recalcule et persiste les agrégats d'avis d'une annonce (moyenne + nombre).
 * À appeler après toute écriture d'avis. ratingAvg = null quand il n'y a aucun
 * avis (relégué en fin de tri par note). Module serveur — partagé par
 * submitReviewAction et le seed.
 */
export async function recomputePropertyRating(propertyId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { propertyId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      ratingCount: agg._count.rating,
      ratingAvg: agg._count.rating > 0 ? agg._avg.rating : null,
    },
  });
}

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
  prixMin?: string;
  prixMax?: string;
  verifie?: string;
  certifie?: string;
  // Cases à cocher répétées → Next.js donne une string si une seule est
  // cochée, un string[] si plusieurs (cf. parseAmenitiesParam).
  equipements?: string | string[];
  tri?: string;
  page?: string;
};

export type ImmobilierSearchParams = {
  transaction?: string;
  gouvernorat?: string;
  prixMin?: string;
  prixMax?: string;
  surfaceMin?: string;
  pieces?: string;
  verifie?: string;
  certifie?: string;
  tri?: string;
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

  // Fourchette de prix à la nuitée (TND). Réutilisée pour les suggestions à
  // filtres égaux (baseWhere), comme la capacité et la disponibilité.
  const prixMin = parsePositiveInt(params.prixMin);
  const prixMax = parsePositiveInt(params.prixMax);
  if (prixMin || prixMax) {
    baseWhere.price = {
      ...(prixMin ? { gte: prixMin } : {}),
      ...(prixMax ? { lte: prixMax } : {}),
    };
  }

  // Cases « Vérifié Darna » / « Certifié Wakil » — filtre niveau de vérification.
  Object.assign(baseWhere, verificationFilter(params));

  // Filtre équipements : amenities est un String « A|B|C » (héritage SQLite),
  // chaque équipement coché doit apparaître dans la chaîne. Aucun libellé
  // d'AMENITIES n'est une sous-chaîne d'un autre, donc `contains` par équipement
  // suffit sans faux positifs.
  const equipements = parseAmenitiesParam(params.equipements);
  if (equipements.length) {
    baseWhere.AND = equipements.map((a) => ({ amenities: { contains: a } }));
  }

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
      sort: parseSortKey(params.tri),
      suggestions: null as StaySuggestions | null,
    };
  }

  const where: Prisma.PropertyWhereInput = resolvedCity
    ? { ...baseWhere, city: resolvedCity }
    : baseWhere;

  const sort = parseSortKey(params.tri);

  const [results, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: listingCardInclude,
      orderBy: orderByForSort(sort),
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

  return { results, resolvedCity, unknownCity, total, page, pageSize: PAGE_SIZE, sort, suggestions };
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

  // Cases « Vérifié Darna » / « Certifié Wakil » — filtre niveau de vérification.
  Object.assign(where, verificationFilter(params));

  const page = parsePage(params.page);
  const skip = (page - 1) * PAGE_SIZE;

  const sort = parseSortKey(params.tri);

  const [results, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: listingCardInclude,
      orderBy: orderByForSort(sort),
      take: PAGE_SIZE,
      skip,
    }),
    prisma.property.count({ where }),
  ]);

  return { results, transaction, total, page, pageSize: PAGE_SIZE, sort };
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

export type HostProfile = {
  id: string;
  name: string;
  image: string | null;
  role: string;
  kycStatus: string;
  createdAt: Date;
  listings: ListingWithPhoto[];
  ratingAvg: number | null;
  ratingCount: number;
};

/**
 * Fiche hôte publique (F4/F3) : uniquement pour un HOTE/AGENCE (jamais un
 * VOYAGEUR, même en visitant directement /hote/[id]). Note = agrégat sur TOUS
 * les avis reçus par cet hôte (pas seulement ses annonces encore actives) —
 * la réputation d'un hôte survit à l'expiration d'une annonce individuelle.
 */
export async function getHostProfile(id: string): Promise<HostProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, image: true, role: true, kycStatus: true, createdAt: true },
  });
  if (!user || (user.role !== "HOTE" && user.role !== "AGENCE")) return null;

  const [listings, rating] = await Promise.all([
    prisma.property.findMany({
      where: { ...activeListingWhere(), ownerId: id },
      include: listingCardInclude,
      orderBy: listingOrderBy,
    }),
    prisma.review.aggregate({
      where: { property: { ownerId: id } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return {
    ...user,
    listings,
    ratingAvg: rating._count.rating > 0 ? rating._avg.rating : null,
    ratingCount: rating._count.rating,
  };
}

/**
 * Annonces comparables en fin de fiche : même ville + même type, hors
 * l'annonce courante. Retourne un tableau vide (pas d'erreur) si rien de
 * comparable — la section « Annonces similaires » se masque alors côté UI.
 */
export async function getSimilarListings(
  property: { id: string; city: string; type: string },
  take = 4
): Promise<ListingWithPhoto[]> {
  return prisma.property.findMany({
    where: {
      ...activeListingWhere(),
      type: property.type,
      city: property.city,
      id: { not: property.id },
    },
    include: listingCardInclude,
    orderBy: listingOrderBy,
    take,
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
