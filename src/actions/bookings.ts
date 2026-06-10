"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fr } from "@/lib/i18n/fr";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SERVICE_FEE_RATE } from "@/lib/config";

export type BookingFormState = { error?: string } | undefined;

const DAY = 24 * 60 * 60 * 1000;

const createSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  arrivee: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  depart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  voyageurs: z.coerce.number().int().min(1).max(30),
});

export async function createBookingAction(
  _prev: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const user = await requireUser();

  const parsed = createSchema.safeParse({
    slug: formData.get("slug"),
    arrivee: formData.get("arrivee"),
    depart: formData.get("depart"),
    voyageurs: formData.get("voyageurs"),
  });
  if (!parsed.success) return { error: fr.booking.datesInvalides };

  const checkIn = new Date(`${parsed.data.arrivee}T00:00:00`);
  const checkOut = new Date(`${parsed.data.depart}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / DAY);
  if (
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime()) ||
    checkIn < today ||
    nights < 1 ||
    nights > 90
  ) {
    return { error: fr.booking.datesInvalides };
  }

  // Le prix est TOUJOURS recalculé côté serveur depuis la base.
  const property = await prisma.property.findUnique({
    where: { slug: parsed.data.slug },
    select: {
      id: true,
      type: true,
      status: true,
      expiresAt: true,
      price: true,
      maxGuests: true,
      ownerId: true,
    },
  });
  if (
    !property ||
    property.type !== "SEJOUR" ||
    property.status !== "ACTIVE" ||
    property.expiresAt.getTime() < Date.now()
  ) {
    return { error: fr.booking.datesIndisponibles };
  }
  if (property.maxGuests && parsed.data.voyageurs > property.maxGuests) {
    return { error: fr.booking.capaciteDepassee(property.maxGuests) };
  }

  // Vérification de disponibilité au moment T (réservations + blocages).
  const conflict = await prisma.property.findFirst({
    where: {
      id: property.id,
      OR: [
        {
          bookings: {
            some: {
              status: "CONFIRMEE",
              checkIn: { lt: checkOut },
              checkOut: { gt: checkIn },
            },
          },
        },
        {
          availabilities: {
            some: { startDate: { lt: checkOut }, endDate: { gt: checkIn } },
          },
        },
      ],
    },
    select: { id: true },
  });
  if (conflict) return { error: fr.booking.datesIndisponibles };

  const subtotal = property.price * nights;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);

  const booking = await prisma.booking.create({
    data: {
      propertyId: property.id,
      guestId: user.id,
      checkIn,
      checkOut,
      guests: parsed.data.voyageurs,
      nightlyPrice: property.price,
      serviceFee,
      totalPrice: subtotal + serviceFee,
      status: "EN_ATTENTE",
    },
  });

  redirect(`/reservation/${booking.id}/paiement`);
}

const confirmSchema = z.string().cuid();

/** Paiement simulé : passe la réservation en séquestre Darna. */
export async function confirmPaymentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = confirmSchema.safeParse(formData.get("bookingId"));
  if (!parsed.success) return;

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data },
    select: { id: true, guestId: true, status: true },
  });
  // Autorisation : seul le voyageur concerné peut payer sa réservation.
  if (!booking || booking.guestId !== user.id || booking.status !== "EN_ATTENTE") {
    return;
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMEE", escrow: "EN_SEQUESTRE" },
  });

  revalidatePath(`/reservation/${booking.id}/paiement`);
  revalidatePath("/dashboard/reservations");
}

export type ReviewFormState = { error?: string; success?: string } | undefined;

const reviewSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
});

/**
 * Avis : uniquement par le voyageur d'une réservation confirmée et terminée.
 * La FK du schéma rend tout avis orphelin impossible ; on vérifie ici le
 * statut, l'auteur et l'unicité.
 */
export async function submitReviewAction(
  _prev: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const user = await requireUser();

  const parsed = reviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { review: { select: { id: true } }, property: { select: { slug: true } } },
  });

  const eligible =
    booking &&
    booking.guestId === user.id &&
    (booking.status === "CONFIRMEE" || booking.status === "TERMINEE") &&
    booking.checkOut.getTime() < Date.now() &&
    !booking.review;

  if (!eligible) return { error: fr.property.avisRefuse };

  await prisma.review.create({
    data: {
      bookingId: booking.id,
      propertyId: booking.propertyId,
      authorId: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  revalidatePath(`/annonce/${booking.property.slug}`);
  return { success: fr.property.avisEnvoye };
}
