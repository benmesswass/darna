/**
 * Fiche voyageur : contrairement à `/hote/[id]` (page marketing publique,
 * indexée), un voyageur est un particulier — l'accès est gaté SERVEUR, réservé
 * à un hôte ayant reçu ce voyageur (au moins une réservation
 * CONFIRMEE/TERMINEE sur une de ses annonces). Pas de sitemap, `noindex`
 * (cf. src/app/robots.ts).
 */

import { prisma } from "@/lib/prisma";

export type TravelerGuestReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  authorName: string;
};

export type ReviewableBooking = {
  id: string;
  propertyTitle: string;
};

export type TravelerProfile = {
  id: string;
  name: string;
  image: string | null;
  kycStatus: string;
  createdAt: Date;
  ratingAvg: number | null;
  ratingCount: number;
  reviews: TravelerGuestReview[];
  /** Séjours de CE hôte avec CE voyageur, terminés, pas encore notés — mêmes
   * conditions que submitGuestReviewAction (formulaire proposé ici aussi). */
  reviewableBookings: ReviewableBooking[];
};

export async function getTravelerProfile(
  id: string,
  viewerId: string
): Promise<TravelerProfile | null> {
  const [target, hasReceivedBooking] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, image: true, role: true, kycStatus: true, createdAt: true },
    }),
    prisma.booking.findFirst({
      where: {
        guestId: id,
        status: { in: ["CONFIRMEE", "TERMINEE"] },
        property: { ownerId: viewerId },
      },
      select: { id: true },
    }),
  ]);

  if (!target || target.role !== "VOYAGEUR" || !hasReceivedBooking) return null;

  const [rating, reviews, reviewableBookings] = await Promise.all([
    prisma.guestReview.aggregate({
      where: { targetId: id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.guestReview.findMany({
      where: { targetId: id },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    // Mêmes conditions d'éligibilité que submitGuestReviewAction : le
    // formulaire proposé ici n'est qu'un raccourci, l'action revérifie tout.
    prisma.booking.findMany({
      where: {
        guestId: id,
        property: { ownerId: viewerId },
        status: { in: ["CONFIRMEE", "TERMINEE"] },
        checkOut: { lt: new Date() },
        guestReview: null,
      },
      select: { id: true, property: { select: { title: true } } },
      orderBy: { checkOut: "desc" },
    }),
  ]);

  return {
    id: target.id,
    name: target.name,
    image: target.image,
    kycStatus: target.kycStatus,
    createdAt: target.createdAt,
    ratingAvg: rating._count.rating > 0 ? rating._avg.rating : null,
    ratingCount: rating._count.rating,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      authorName: r.author.name,
    })),
    reviewableBookings: reviewableBookings.map((b) => ({
      id: b.id,
      propertyTitle: b.property.title,
    })),
  };
}
