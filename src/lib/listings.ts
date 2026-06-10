import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveCity } from "@/lib/geo";

/**
 * Fraîcheur des données : seules les annonces ACTIVE et non expirées
 * apparaissent dans les recherches — réponse structurelle aux annonces
 * périmées des concurrents.
 */
export function activeListingWhere(): Prisma.PropertyWhereInput {
  return { status: "ACTIVE", expiresAt: { gt: new Date() } };
}

export const listingCardInclude = {
  photos: { orderBy: { position: "asc" as const }, take: 1 },
} satisfies Prisma.PropertyInclude;

export type ListingWithPhoto = Prisma.PropertyGetPayload<{
  include: typeof listingCardInclude;
}>;

export type SejoursSearchParams = {
  ville?: string;
  arrivee?: string;
  depart?: string;
  voyageurs?: string;
};

export type ImmobilierSearchParams = {
  transaction?: string;
  gouvernorat?: string;
  prixMin?: string;
  prixMax?: string;
  surfaceMin?: string;
  pieces?: string;
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

export async function searchSejours(params: SejoursSearchParams) {
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

  const voyageurs = parsePositiveInt(params.voyageurs);
  if (voyageurs) where.maxGuests = { gte: voyageurs };

  const arrivee = parseDate(params.arrivee);
  const depart = parseDate(params.depart);
  if (arrivee && depart && depart > arrivee) {
    // Exclut les biens dont les dates chevauchent une réservation confirmée
    // ou une période bloquée par l'hôte.
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

  const results = unknownCity
    ? []
    : await prisma.property.findMany({
        where,
        include: listingCardInclude,
        orderBy: [{ verified: "desc" }, { publishedAt: "desc" }],
      });

  return { results, resolvedCity, unknownCity };
}

export async function searchImmobilier(params: ImmobilierSearchParams) {
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

  const results = await prisma.property.findMany({
    where,
    include: listingCardInclude,
    orderBy: [{ verified: "desc" }, { publishedAt: "desc" }],
  });

  return { results, transaction };
}

export async function getPropertyBySlug(slug: string) {
  return prisma.property.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { position: "asc" } },
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
