import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveCity } from "@/lib/geo";

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
} satisfies Prisma.PropertyInclude;

export type ListingWithPhoto = Prisma.PropertyGetPayload<{
  include: typeof listingCardInclude;
}>;

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

export async function searchSejours(params: SejoursSearchParams) {
  await clearExpiredFeatured();

  const where: Prisma.PropertyWhereInput = {
    ...activeListingWhere(),
    type: "SEJOUR",
  };

  // Recherche tolérante à la translittération (« 7ammamet » → Hammamet).
  let resolvedCity: string | null = null;
  let unknownCity = false;
  if (params.ville?.trim()) {
    resolvedCity = resolveCity(params.ville);
    if (resolvedCity) {
      where.city = resolvedCity;
    } else {
      unknownCity = true;
    }
  }

  // Filtre capacité sur la table satellite (M2) : un séjour matche s'il a une
  // ligne StayDetails dont maxGuests ≥ voyageurs (équivalent à l'ancien filtre
  // sur Property.maxGuests, les valeurs étant synchronisées en shadow).
  const voyageurs = parsePositiveInt(params.voyageurs);
  if (voyageurs) where.stay = { maxGuests: { gte: voyageurs } };

  const arrivee = parseDate(params.arrivee);
  const depart = parseDate(params.depart);
  if (arrivee && depart && depart > arrivee) {
    where.NOT = {
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

  const page = parsePage(params.page);
  const skip = (page - 1) * PAGE_SIZE;

  if (unknownCity) {
    return { results: [], resolvedCity, unknownCity, total: 0, page, pageSize: PAGE_SIZE };
  }

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

  return { results, resolvedCity, unknownCity, total, page, pageSize: PAGE_SIZE };
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
