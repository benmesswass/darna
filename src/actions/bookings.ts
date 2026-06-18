"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SERVICE_FEE_RATE, SITE_URL } from "@/lib/config";
import { BOOKING_EXPIRY_MS } from "@/lib/constants";
import { logAudit, logStructured } from "@/lib/audit";
import { initKonnectPayment, isKonnectEnabled } from "@/lib/konnect";

export type BookingFormState = { error?: string } | undefined;

const DAY = 24 * 60 * 60 * 1000;

const createSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  arrivee: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  depart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  voyageurs: z.coerce.number().int().min(1).max(30),
});

/** Erreur interne signalant un conflit de disponibilité à l'intérieur de la transaction. */
class BookingConflictError extends Error {
  constructor() {
    super("BOOKING_CONFLICT");
  }
}

/**
 * Filtre Prisma des réservations qui bloquent RÉELLEMENT un créneau : les
 * réservations confirmées + les holds EN_ATTENTE encore vivants. Les holds
 * expirés (créés lors d'une tentative abandonnée, pas encore balayés en ANNULEE)
 * NE bloquent PAS : sinon un panier expiré rendrait les dates « indisponibles »
 * alors que le calendrier les propose librement (la page reserver filtre déjà
 * `expiresAt > now`). C'est exactement le même critère, gardé cohérent ici.
 */
function blockingBookingOverlap(checkIn: Date, checkOut: Date) {
  return {
    checkIn: { lt: checkOut },
    checkOut: { gt: checkIn },
    OR: [
      { status: "CONFIRMEE" },
      { status: "EN_ATTENTE", expiresAt: { gt: new Date() } },
    ],
  };
}

export async function createBookingAction(
  _prev: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const fr = await getT();
  const user = await requireUser();

  const parsed = createSchema.safeParse({
    slug: formData.get("slug"),
    arrivee: formData.get("arrivee"),
    depart: formData.get("depart"),
    voyageurs: formData.get("voyageurs"),
  });
  if (!parsed.success) return { error: fr.booking.datesInvalides };

  // Dates en UTC explicite pour éviter les ambiguïtés de fuseau horaire
  const checkIn = new Date(`${parsed.data.arrivee}T00:00:00.000Z`);
  const checkOut = new Date(`${parsed.data.depart}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

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

  // Pré-chargement de la propriété hors transaction (lecture non critique)
  const property = await prisma.property.findUnique({
    where: { slug: parsed.data.slug },
    select: {
      id: true,
      type: true,
      status: true,
      expiresAt: true,
      price: true,
      // Capacité depuis la table satellite (M2).
      stay: { select: { maxGuests: true } },
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

  // GUARD : un hôte ne peut pas réserver son propre logement
  if (property.ownerId === user.id) {
    return { error: fr.booking.proprietaireImpossible };
  }

  if (property.stay?.maxGuests && parsed.data.voyageurs > property.stay.maxGuests) {
    return { error: fr.booking.capaciteDepassee(property.stay.maxGuests) };
  }

  const subtotal = property.price * nights;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const totalPrice = subtotal + serviceFee;
  const expiresAt = new Date(Date.now() + BOOKING_EXPIRY_MS);

  let bookingId: string;

  try {
    /**
     * TRANSACTION ATOMIQUE — protège contre le double booking (TOCTOU).
     *
     * Les trois étapes (expiration des EN_ATTENTE, vérification conflit,
     * création réservation) s'exécutent en une seule transaction SERIALIZABLE
     * (PostgreSQL) — garantie anti double-réservation sous concurrence.
     * Retry applicatif sur conflit de sérialisation (P2034) → Phase 2.
     */
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Expiration paresseuse des réservations EN_ATTENTE périmées
      //    (nettoyage opportuniste — évite un job cron séparé)
      await tx.booking.updateMany({
        where: {
          propertyId: property.id,
          status: "EN_ATTENTE",
          expiresAt: { lt: new Date() },
        },
        data: { status: "ANNULEE" },
      });

      // 2. Vérification de disponibilité DANS la transaction
      //    (TOCTOU impossible : lecture et écriture sont atomiques)
      const conflict = await tx.property.findFirst({
        where: {
          id: property.id,
          OR: [
            { bookings: { some: blockingBookingOverlap(checkIn, checkOut) } },
            {
              availabilities: {
                some: { startDate: { lt: checkOut }, endDate: { gt: checkIn } },
              },
            },
          ],
        },
        select: { id: true },
      });

      if (conflict) throw new BookingConflictError();

      // 3. Création de la réservation — prix TOUJOURS calculé côté serveur
      return tx.booking.create({
        data: {
          propertyId: property.id,
          guestId: user.id,
          checkIn,
          checkOut,
          guests: parsed.data.voyageurs,
          nightlyPrice: property.price,
          serviceFee,
          totalPrice,
          status: "EN_ATTENTE",
          expiresAt,
        },
        select: { id: true },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    bookingId = booking.id;
  } catch (err) {
    if (err instanceof BookingConflictError) {
      logStructured("warn", "booking.conflict", {
        propertyId: property.id,
        userId: user.id,
        checkIn: parsed.data.arrivee,
        checkOut: parsed.data.depart,
      });
      return { error: fr.booking.datesIndisponibles };
    }
    throw err;
  }

  await logAudit({
    action: "BOOKING_CREATED",
    userId: user.id,
    success: true,
    metadata: {
      bookingId,
      propertyId: property.id,
      checkIn: parsed.data.arrivee,
      checkOut: parsed.data.depart,
      nights,
      totalPrice,
    },
  });

  redirect(`/reservation/${bookingId}/paiement`);
}

export type BookingQuote =
  | { ok: true; nights: number; subtotal: number; serviceFee: number; total: number }
  | { ok: false; error: string };

const quoteSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  arrivee: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  depart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  voyageurs: z.coerce.number().int().min(1).max(30),
});

/**
 * Devis (aperçu) du séjour, calculé CÔTÉ SERVEUR pour alimenter le
 * récapitulatif en direct — sans rechargement de page. Lecture seule : aucune
 * confiance n'est faite au client, et le prix faisant foi est de toute façon
 * recalculé à la création (createBookingAction). Vérifie aussi la dispo pour
 * signaler tout de suite des dates qui viendraient d'être prises.
 */
export async function quoteBookingAction(input: {
  slug: string;
  arrivee: string;
  depart: string;
  voyageurs: number;
}): Promise<BookingQuote> {
  const fr = await getT();
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: fr.booking.datesInvalides };

  const checkIn = new Date(`${parsed.data.arrivee}T00:00:00.000Z`);
  const checkOut = new Date(`${parsed.data.depart}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / DAY);
  if (checkIn < today || nights < 1 || nights > 90) {
    return { ok: false, error: fr.booking.datesInvalides };
  }

  const property = await prisma.property.findUnique({
    where: { slug: parsed.data.slug },
    select: {
      id: true,
      type: true,
      status: true,
      expiresAt: true,
      price: true,
      // Capacité depuis la table satellite (M2).
      stay: { select: { maxGuests: true } },
    },
  });
  if (
    !property ||
    property.type !== "SEJOUR" ||
    property.status !== "ACTIVE" ||
    property.expiresAt.getTime() < Date.now()
  ) {
    return { ok: false, error: fr.booking.datesIndisponibles };
  }
  if (property.stay?.maxGuests && parsed.data.voyageurs > property.stay.maxGuests) {
    return { ok: false, error: fr.booking.capaciteDepassee(property.stay.maxGuests) };
  }

  // Conflit de disponibilité : réservations actives + blocages hôte.
  const conflict = await prisma.property.findFirst({
    where: {
      id: property.id,
      OR: [
        { bookings: { some: blockingBookingOverlap(checkIn, checkOut) } },
        {
          availabilities: {
            some: { startDate: { lt: checkOut }, endDate: { gt: checkIn } },
          },
        },
      ],
    },
    select: { id: true },
  });
  if (conflict) return { ok: false, error: fr.booking.datesIndisponibles };

  const subtotal = property.price * nights;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  return { ok: true, nights, subtotal, serviceFee, total: subtotal + serviceFee };
}

const confirmSchema = z.string().cuid();

/** Paiement simulé : passe la réservation en séquestre Darna. */
export async function confirmPaymentAction(formData: FormData): Promise<void> {
  // Garde : si Konnect est actif, seul le flux réel (startKonnectPaymentAction
  // + webhook) confirme un paiement. Le chemin mock ne doit jamais coexister
  // avec le paiement réel (sinon contournement : confirmer sans payer).
  if (isKonnectEnabled()) return;

  const user = await requireUser();
  const parsed = confirmSchema.safeParse(formData.get("bookingId"));
  if (!parsed.success) return;

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data },
    select: { id: true, guestId: true, status: true, expiresAt: true, totalPrice: true },
  });

  // Autorisation stricte : seul le voyageur concerné peut payer sa réservation
  if (!booking || booking.guestId !== user.id) return;

  // Vérification du statut et de l'expiration
  if (booking.status !== "EN_ATTENTE") return;
  if (booking.expiresAt && booking.expiresAt < new Date()) {
    // Réservation expirée : l'annuler silencieusement
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "ANNULEE" },
    });
    logStructured("warn", "payment.booking_expired", {
      bookingId: booking.id,
      userId: user.id,
    });
    return;
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CONFIRMEE",
      escrow: "EN_SEQUESTRE",
      expiresAt: null, // Plus d'expiration une fois confirmé
      paidAt: new Date(),
      demo: true, // Aucun argent réel n'a transité : réservation marquée DÉMO.
    },
  });

  await logAudit({
    action: "PAYMENT_CONFIRMED",
    userId: user.id,
    success: true,
    metadata: { bookingId: booking.id, totalPrice: booking.totalPrice, demo: true },
  });

  revalidatePath(`/reservation/${booking.id}/paiement`);
  revalidatePath("/dashboard/reservations");
}

export type PaymentFormState =
  | { error?: string; payUrl?: string }
  | undefined;

/**
 * Démarre un paiement réel Konnect : initialise la transaction, stocke le
 * `paymentRef` sur la réservation et renvoie le `payUrl` (le client y redirige).
 * La confirmation se fait ensuite via le webhook ou le retour `?konnect=success`
 * (cf. settleKonnectBooking) — JAMAIS ici, car l'argent n'est pas encore réglé.
 */
export async function startKonnectPaymentAction(
  _prev: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const fr = await getT();
  const user = await requireUser();

  if (!isKonnectEnabled()) return { error: fr.common.erreurInconnue };

  const parsed = confirmSchema.safeParse(formData.get("bookingId"));
  if (!parsed.success) return { error: fr.common.erreurInconnue };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      guestId: true,
      status: true,
      expiresAt: true,
      totalPrice: true,
      property: { select: { title: true } },
    },
  });

  // Autorisation stricte : seul le voyageur concerné paie sa réservation.
  if (!booking || booking.guestId !== user.id) return { error: fr.common.erreurInconnue };
  if (booking.status !== "EN_ATTENTE") return { error: fr.booking.datesIndisponibles };
  if (booking.expiresAt && booking.expiresAt < new Date()) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "ANNULEE" },
    });
    return { error: fr.booking.reservationExpiree };
  }

  // Lien de paiement aligné sur le hold de la réservation (≥ 2 min de marge).
  const remainingMs = booking.expiresAt
    ? booking.expiresAt.getTime() - Date.now()
    : BOOKING_EXPIRY_MS;
  const lifespanMinutes = Math.max(2, Math.ceil(remainingMs / 60000));

  const [firstName, ...rest] = user.name.trim().split(/\s+/);

  let payUrl: string;
  let paymentRef: string;
  try {
    const result = await initKonnectPayment({
      amountTND: booking.totalPrice,
      orderId: booking.id,
      description: `Darna — ${booking.property.title}`,
      webhook: `${SITE_URL}/api/payments/konnect/webhook`,
      successUrl: `${SITE_URL}/reservation/${booking.id}/paiement?konnect=success`,
      failUrl: `${SITE_URL}/reservation/${booking.id}/paiement?konnect=fail`,
      lifespanMinutes,
      firstName: firstName || user.name,
      lastName: rest.join(" ") || undefined,
      email: user.email,
      phoneNumber: user.phone ?? undefined,
    });
    payUrl = result.payUrl;
    paymentRef = result.paymentRef;
  } catch (err) {
    logStructured("error", "konnect.init_failed", {
      bookingId: booking.id,
      userId: user.id,
      error: (err as Error).message,
    });
    await logAudit({
      action: "PAYMENT_FAILED",
      userId: user.id,
      success: false,
      metadata: { bookingId: booking.id, stage: "init" },
    });
    return { error: fr.booking.paiementKonnectErreur };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { paymentRef },
  });

  await logAudit({
    action: "PAYMENT_INITIATED",
    userId: user.id,
    success: true,
    metadata: { bookingId: booking.id, paymentRef, provider: "konnect" },
  });

  return { payUrl };
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
  const fr = await getT();
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

  await logAudit({
    action: "REVIEW_SUBMITTED",
    userId: user.id,
    success: true,
    metadata: { bookingId: booking.id, rating: parsed.data.rating },
  });

  revalidatePath(`/annonce/${booking.property.slug}`);
  return { success: fr.property.avisEnvoye };
}
