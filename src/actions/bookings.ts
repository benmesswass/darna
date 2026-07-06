"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  SERVICE_FEE_RATE,
  SITE_URL,
  HOST_INVOICE_DUE_DAYS,
  computeDepositAmount,
  clampPayAmount,
  hostCancelBlockDays,
} from "@/lib/config";
import { BOOKING_EXPIRY_MS, HOST_ACCEPTANCE_EXPIRY_MS, PAYMENT_MODES } from "@/lib/constants";
import { logAudit, logStructured } from "@/lib/audit";
import { recomputePropertyRating } from "@/lib/listings";
import { initKonnectPayment, isKonnectEnabled, signKonnectWebhook } from "@/lib/konnect";
import { sendBookingConfirmationEmail } from "@/lib/notifications";
import { computeBookingRefund } from "@/lib/cancellation";
import {
  notifyBookingCancelled,
  notifyBookingCancelledByHost,
  notifyBookingConfirmed,
  notifyCashBookingDeclined,
  notifyCashBookingRequested,
  notifyGuestReviewReceived,
  notifyReviewReceived,
} from "@/lib/notification-center";
import { isSuspended, applySuspension } from "@/lib/suspension";
import type { CancelPolicy } from "@/lib/constants";

export type BookingFormState = { error?: string } | undefined;

const DAY = 24 * 60 * 60 * 1000;

const createSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  arrivee: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  depart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  voyageurs: z.coerce.number().int().min(1).max(30),
  // Rail 2 (paiement sur place) : optionnel, ESCROW par défaut — cf.
  // PAIEMENT_SUR_PLACE_ROADMAP.md §PSP3. Toujours revérifié serveur
  // (éligibilité propriété + KYC), jamais pris tel quel.
  paymentMode: z.enum(PAYMENT_MODES).optional().default("ESCROW"),
});

/** Erreur interne signalant un conflit de disponibilité à l'intérieur de la transaction. */
class BookingConflictError extends Error {
  constructor() {
    super("BOOKING_CONFLICT");
  }
}

/**
 * Filtre Prisma des réservations qui bloquent RÉELLEMENT un créneau : les
 * réservations confirmées + les holds EN_ATTENTE encore vivants + les
 * demandes Rail 2 EN_ATTENTE_ACCEPTATION encore vivantes (même logique : tant
 * que l'hôte n'a pas refusé/laissé expirer, ces dates ne sont pas libres pour
 * un autre voyageur). Les holds/demandes expirés (créés lors d'une tentative
 * abandonnée, pas encore balayés en ANNULEE) NE bloquent PAS : sinon un panier
 * expiré rendrait les dates « indisponibles » alors que le calendrier les
 * propose librement (la page reserver filtre déjà `expiresAt > now`). C'est
 * exactement le même critère, gardé cohérent ici.
 */
function blockingBookingOverlap(checkIn: Date, checkOut: Date) {
  return {
    checkIn: { lt: checkOut },
    checkOut: { gt: checkIn },
    OR: [
      { status: "CONFIRMEE" },
      { status: "EN_ATTENTE", expiresAt: { gt: new Date() } },
      { status: "EN_ATTENTE_ACCEPTATION", expiresAt: { gt: new Date() } },
    ],
  };
}

export async function createBookingAction(
  _prev: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const fr = await getT();
  const user = await requireUser();

  // Gate de confiance : réserver exige un compte vérifié (e-mail + téléphone).
  // Backstop serveur — l'UI propose déjà la vérif, mais on ne fait jamais
  // confiance au client. La CIN n'est PAS requise pour réserver (côté voyageur).
  if (!user.emailVerified || !user.phoneVerified) {
    return { error: fr.booking.verifRequise };
  }

  // Compte suspendu ACTIF (anti-bypass) : réservation bloquée le temps de la
  // suspension (temporaire ou indéfinie).
  if (isSuspended(user)) {
    return { error: fr.booking.compteSuspendu };
  }

  const parsed = createSchema.safeParse({
    slug: formData.get("slug"),
    arrivee: formData.get("arrivee"),
    depart: formData.get("depart"),
    voyageurs: formData.get("voyageurs"),
    paymentMode: formData.get("paymentMode") || undefined,
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
      cashPaymentEnabled: true,
      cancelBlockedUntil: true,
    },
  });

  if (
    !property ||
    property.type !== "SEJOUR" ||
    property.status !== "ACTIVE" ||
    property.expiresAt.getTime() < Date.now() ||
    // Annonce temporairement bloquée suite à une annulation hôte (§AH2) :
    // refusée même via un lien direct, pas seulement masquée de la recherche.
    (property.cancelBlockedUntil && property.cancelBlockedUntil.getTime() > Date.now())
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

  // Rail 2 (paiement sur place) : éligibilité vérifiée SERVEUR, jamais
  // confiance au client — l'annonce doit avoir activé le mode ET le voyageur
  // avoir un KYC RÉELLEMENT vérifié (VERIFIE strict, pas DEMO_VERIFIE : plus
  // strict que la gate email+téléphone du mode ESCROW, en l'absence de
  // garantie financière). Cf. PAIEMENT_SUR_PLACE_ROADMAP.md §PSP3.
  const wantsCash = parsed.data.paymentMode === "SUR_PLACE";
  if (wantsCash) {
    if (!property.cashPaymentEnabled) return { error: fr.booking.cashNonDisponible };
    if (user.kycStatus !== "VERIFIE") return { error: fr.booking.cashKycRequis };
  }

  const subtotal = property.price * nights;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const totalPrice = subtotal + serviceFee;
  // Acompte minimum dû en ligne, figé dès la création du hold (anti-bypass).
  // Sans objet en Rail 2 : zéro paiement en ligne, tout est dû cash à l'arrivée.
  const depositAmount = wantsCash ? 0 : computeDepositAmount(totalPrice, serviceFee);
  // Rail 2 : fenêtre d'ACCEPTATION hôte (48h, pas d'urgence de paiement) ;
  // ESCROW : fenêtre de PAIEMENT (15 min, hold classique) — inchangé.
  const expiresAt = new Date(
    Date.now() + (wantsCash ? HOST_ACCEPTANCE_EXPIRY_MS : BOOKING_EXPIRY_MS)
  );

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
      // 1. Expiration paresseuse des réservations EN_ATTENTE (hold paiement)
      //    ET EN_ATTENTE_ACCEPTATION (demande Rail 2 sans réponse hôte)
      //    périmées (nettoyage opportuniste — évite un job cron séparé)
      await tx.booking.updateMany({
        where: {
          propertyId: property.id,
          status: { in: ["EN_ATTENTE", "EN_ATTENTE_ACCEPTATION"] },
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
          depositAmount,
          paymentMode: wantsCash ? "SUR_PLACE" : "ESCROW",
          status: wantsCash ? "EN_ATTENTE_ACCEPTATION" : "EN_ATTENTE",
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
      paymentMode: wantsCash ? "SUR_PLACE" : "ESCROW",
    },
  });

  // Rail 2 : l'hôte doit être notifié qu'une demande attend sa décision (pas
  // de paiement pour la lui signaler autrement).
  if (wantsCash) {
    await notifyCashBookingRequested(bookingId);
  }

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

/** Montant choisi à la réservation : borné [acompte, total] côté serveur. */
const payAmountSchema = z.object({
  bookingId: z.string().cuid(),
  // Montant que le voyageur choisit de régler maintenant (TND). Toujours
  // re-clampé serveur — un client malveillant ne peut ni payer moins que
  // l'acompte ni « confirmer » au-delà du total.
  payAmount: z.coerce.number().finite(),
});

/** Paiement simulé : passe la réservation en séquestre Darna. */
export async function confirmPaymentAction(formData: FormData): Promise<void> {
  // Garde : si Konnect est actif, seul le flux réel (startKonnectPaymentAction
  // + webhook) confirme un paiement. Le chemin mock ne doit jamais coexister
  // avec le paiement réel (sinon contournement : confirmer sans payer).
  if (isKonnectEnabled()) return;

  const user = await requireUser();
  const parsed = payAmountSchema.safeParse({
    bookingId: formData.get("bookingId"),
    payAmount: formData.get("payAmount"),
  });
  if (!parsed.success) return;

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: {
      id: true,
      guestId: true,
      status: true,
      expiresAt: true,
      totalPrice: true,
      depositAmount: true,
    },
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

  // Montant réellement encaissé : le choix du voyageur, CLAMPÉ serveur dans
  // [acompte, total]. Jamais de confiance au montant brut du formulaire.
  const amountPaid = clampPayAmount(
    parsed.data.payAmount,
    booking.depositAmount,
    booking.totalPrice
  );

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CONFIRMEE",
      escrow: "EN_SEQUESTRE",
      expiresAt: null, // Plus d'expiration une fois confirmé
      paidAt: new Date(),
      amountPaid,
      demo: true, // Aucun argent réel n'a transité : réservation marquée DÉMO.
    },
  });

  await logAudit({
    action: "PAYMENT_CONFIRMED",
    userId: user.id,
    success: true,
    metadata: {
      bookingId: booking.id,
      amountPaid,
      totalPrice: booking.totalPrice,
      demo: true,
    },
  });

  await sendBookingConfirmationEmail(booking.id);
  await notifyBookingConfirmed(booking.id);

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

  const parsed = payAmountSchema.safeParse({
    bookingId: formData.get("bookingId"),
    payAmount: formData.get("payAmount"),
  });
  if (!parsed.success) return { error: fr.common.erreurInconnue };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: {
      id: true,
      guestId: true,
      status: true,
      expiresAt: true,
      totalPrice: true,
      depositAmount: true,
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

  // Montant à débiter = choix du voyageur, CLAMPÉ serveur dans [acompte, total].
  // Mémorisé sur la réservation (amountPaid) AVANT la redirection : devient la
  // source de vérité du montant attendu, revérifiée au règlement (settle).
  const amountToCharge = clampPayAmount(
    parsed.data.payAmount,
    booking.depositAmount,
    booking.totalPrice
  );

  const [firstName, ...rest] = user.name.trim().split(/\s+/);

  let payUrl: string;
  let paymentRef: string;
  try {
    const result = await initKonnectPayment({
      amountTND: amountToCharge,
      orderId: booking.id,
      description: `Darna — ${booking.property.title}`,
      // URL de webhook SIGNÉE : on y joint le bookingId + son HMAC. Konnect
      // préserve ces paramètres et y ajoute `&payment_ref=…`. Le webhook
      // revérifie la signature avant d'agir (cf. route.ts / verifyKonnectWebhook).
      webhook: `${SITE_URL}/api/payments/konnect/webhook?bid=${booking.id}&sig=${signKonnectWebhook(booking.id)}`,
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
    data: { paymentRef, amountPaid: amountToCharge },
  });

  await logAudit({
    action: "PAYMENT_INITIATED",
    userId: user.id,
    success: true,
    metadata: {
      bookingId: booking.id,
      paymentRef,
      amountToCharge,
      provider: "konnect",
    },
  });

  return { payUrl };
}

export type ReviewFormState = { error?: string; success?: string } | undefined;

const reviewSchema = z.object({
  bookingId: z.string().cuid(),
  // Sous-notes (F2) : la note globale n'est jamais saisie séparément, elle
  // est calculée serveur (moyenne arrondie) pour rester toujours cohérente.
  proprete: z.coerce.number().int().min(1).max(5),
  communication: z.coerce.number().int().min(1).max(5),
  conformite: z.coerce.number().int().min(1).max(5),
  qualitePrix: z.coerce.number().int().min(1).max(5),
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
    proprete: formData.get("proprete"),
    communication: formData.get("communication"),
    conformite: formData.get("conformite"),
    qualitePrix: formData.get("qualitePrix"),
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

  // Note globale = moyenne arrondie des 4 sous-notes (jamais saisie à part).
  const rating = Math.round(
    (parsed.data.proprete +
      parsed.data.communication +
      parsed.data.conformite +
      parsed.data.qualitePrix) /
      4
  );

  await prisma.review.create({
    data: {
      bookingId: booking.id,
      propertyId: booking.propertyId,
      authorId: user.id,
      rating,
      proprete: parsed.data.proprete,
      communication: parsed.data.communication,
      conformite: parsed.data.conformite,
      qualitePrix: parsed.data.qualitePrix,
      comment: parsed.data.comment,
    },
  });

  // Met à jour les agrégats d'avis dénormalisés (tri « mieux/moins notés »).
  await recomputePropertyRating(booking.propertyId);
  await notifyReviewReceived(booking.propertyId);

  await logAudit({
    action: "REVIEW_SUBMITTED",
    userId: user.id,
    success: true,
    metadata: { bookingId: booking.id, rating },
  });

  revalidatePath(`/annonce/${booking.property.slug}`);
  return { success: fr.property.avisEnvoye };
}

export type GuestReviewFormState = { error?: string; success?: string } | undefined;

const guestReviewSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
});

/**
 * Avis symétrique « hôte → voyageur » (F1) : uniquement par le PROPRIÉTAIRE de
 * l'annonce concernée, sur une réservation confirmée/terminée dont le séjour
 * est passé — mêmes conditions que submitReviewAction côté voyageur. La FK
 * du schéma (GuestReview.bookingId @unique) rend tout avis orphelin ou
 * dupliqué impossible ; on vérifie ici le statut, l'auteur et l'unicité.
 */
export async function submitGuestReviewAction(
  _prev: GuestReviewFormState,
  formData: FormData
): Promise<GuestReviewFormState> {
  const fr = await getT();
  const user = await requireUser();

  const parsed = guestReviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: {
      guestReview: { select: { id: true } },
      property: { select: { slug: true, ownerId: true } },
    },
  });

  const eligible =
    booking &&
    booking.property.ownerId === user.id &&
    (booking.status === "CONFIRMEE" || booking.status === "TERMINEE") &&
    booking.checkOut.getTime() < Date.now() &&
    !booking.guestReview;

  if (!eligible) return { error: fr.property.avisRefuse };

  await prisma.guestReview.create({
    data: {
      bookingId: booking.id,
      targetId: booking.guestId,
      authorId: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });
  await notifyGuestReviewReceived(booking.guestId);

  await logAudit({
    action: "GUEST_REVIEW_SUBMITTED",
    userId: user.id,
    success: true,
    metadata: { bookingId: booking.id, rating: parsed.data.rating },
  });

  revalidatePath("/dashboard/reservations");
  revalidatePath(`/voyageur/${booking.guestId}`);
  return { success: fr.dashboard.avisVoyageurEnvoye };
}

export type CancelBookingState = { error?: string; success?: string } | undefined;

const cancelSchema = z.object({ bookingId: z.string().cuid() });

export async function cancelBookingAction(
  _prev: CancelBookingState,
  formData: FormData
): Promise<CancelBookingState> {
  const fr = await getT();
  const user = await requireUser();

  const parsed = cancelSchema.safeParse({ bookingId: formData.get("bookingId") });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: {
      id: true,
      guestId: true,
      status: true,
      checkIn: true,
      serviceFee: true,
      amountPaid: true,
      createdAt: true,
      property: { select: { slug: true, cancelPolicy: true } },
    },
  });

  if (!booking || booking.guestId !== user.id)
    return { error: fr.common.erreurInconnue };

  if (booking.status !== "CONFIRMEE")
    return { error: fr.booking.annulationImpossible };

  // Annulation gratuite (politique ou grâce 24 h) → remboursement intégral,
  // commission comprise. Sinon la commission Darna reste acquise et seul
  // (encaissé − commission) suit la politique. Cf. computeBookingRefund.
  const { refundAmount } = computeBookingRefund(
    booking.amountPaid,
    booking.serviceFee,
    booking.checkIn,
    booking.property.cancelPolicy as CancelPolicy,
    booking.createdAt
  );

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "ANNULEE",
      escrow: "AUCUN",
      cancelledAt: new Date(),
      refundAmount: refundAmount > 0 ? refundAmount : null,
    },
  });
  await notifyBookingCancelled(booking.id);

  await logAudit({
    action: "BOOKING_CANCELLED",
    userId: user.id,
    success: true,
    metadata: { bookingId: booking.id, refundAmount },
  });

  revalidatePath("/dashboard/reservations");
  revalidatePath(`/annonce/${booking.property.slug}`);
  return { success: fr.booking.annulationConfirmee };
}

export type HostCancelState = { error?: string; success?: string } | undefined;

/**
 * Annulation à L'INITIATIVE DE L'HÔTE (ANNULATION_HOTE_ROADMAP.md §AH1) —
 * distincte de cancelBookingAction ci-dessus (voyageur). Remboursement
 * TOUJOURS intégral (indépendant de cancelPolicy : c'est l'hôte qui rompt,
 * pas le voyageur), blocage temporaire de l'annonce (barème
 * hostCancelBlockDays, src/lib/config.ts) ET suspension progressive de
 * compte de l'hôte (applySuspension, src/lib/suspension.ts) — les deux
 * leviers se cumulent, décision produit du 2026-07-06. Libre-service, sans
 * motif ni revue admin : ces deux sanctions automatiques sont le seul
 * garde-fou (pas de pénalité financière — cf. pivot noté dans le roadmap).
 */
export async function hostCancelBookingAction(
  _prev: HostCancelState,
  formData: FormData
): Promise<HostCancelState> {
  const fr = await getT();
  const user = await requireUser();

  const parsed = cancelSchema.safeParse({ bookingId: formData.get("bookingId") });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: {
      id: true,
      status: true,
      checkIn: true,
      totalPrice: true,
      property: { select: { id: true, ownerId: true, slug: true } },
    },
  });

  // Autorisation stricte : seul le propriétaire de l'annonce peut annuler
  // (IDOR) — jamais le voyageur, qui a déjà cancelBookingAction pour lui.
  if (!booking || booking.property.ownerId !== user.id) {
    return { error: fr.common.erreurInconnue };
  }
  if (booking.status !== "CONFIRMEE") {
    return { error: fr.booking.annulationImpossible };
  }

  // Palier recalculé SERVEUR à partir du délai RÉEL restant — jamais depuis
  // un champ envoyé par le client (le formulaire n'envoie que bookingId).
  const daysUntilCheckIn = (booking.checkIn.getTime() - Date.now()) / DAY;
  const blockDays = hostCancelBlockDays(daysUntilCheckIn);

  // updateMany conditionné à CONFIRMEE : garde d'idempotence contre une
  // double soumission (double clic, requêtes concurrentes) — une 2e
  // tentative ne retrouve plus la réservation dans cet état et échoue
  // proprement, sans double blocage ni double suspension.
  const updated = await prisma.booking.updateMany({
    where: { id: booking.id, status: "CONFIRMEE" },
    data: {
      status: "ANNULEE",
      escrow: "AUCUN",
      cancelledAt: new Date(),
      cancelledByHostAt: new Date(),
      hostCancelBlockDays: blockDays,
      refundAmount: booking.totalPrice,
    },
  });
  if (updated.count === 0) return { error: fr.booking.annulationImpossible };

  await prisma.property.update({
    where: { id: booking.property.id },
    data: { cancelBlockedUntil: new Date(Date.now() + blockDays * DAY) },
  });

  await applySuspension(user.id, "HOST_CANCELLED_BOOKING", { bookingId: booking.id });

  await logAudit({
    action: "HOST_CANCELLED_BOOKING",
    userId: user.id,
    success: true,
    metadata: {
      bookingId: booking.id,
      propertyId: booking.property.id,
      blockDays,
      refundAmount: booking.totalPrice,
    },
  });

  await notifyBookingCancelledByHost(booking.id);

  revalidatePath("/dashboard/reservations");
  revalidatePath(`/annonce/${booking.property.slug}`);
  return { success: fr.booking.annulationHoteConfirmee };
}

// ── Rail 2 : paiement sur place (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP3) ──────

export type CashBookingResponseState = { error?: string; success?: string } | undefined;

const cashBookingIdSchema = z.object({ bookingId: z.string().cuid() });

/**
 * Acceptation hôte d'une demande Rail 2 — seul point d'entrée qui confirme
 * une réservation SUR_PLACE (cf. "Question produit — confirmation de
 * réservation en mode Rail 2" dans PAIEMENT_SUR_PLACE_ROADMAP.md : pas de
 * confirmation instantanée, l'hôte garde la main en l'absence de garantie
 * financière). Génère la HostInvoice dans la MÊME transaction que la
 * confirmation — la commission Darna doit être facturée dès que la
 * réservation existe réellement.
 */
export async function acceptCashBookingAction(
  _prev: CashBookingResponseState,
  formData: FormData
): Promise<CashBookingResponseState> {
  const fr = await getT();
  const user = await requireUser();

  const parsed = cashBookingIdSchema.safeParse({ bookingId: formData.get("bookingId") });
  if (!parsed.success) return { error: fr.common.erreurInconnue };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: {
      id: true,
      status: true,
      paymentMode: true,
      serviceFee: true,
      checkOut: true,
      expiresAt: true,
      property: { select: { ownerId: true, slug: true } },
    },
  });

  // Autorisation stricte : seul le propriétaire de l'annonce peut accepter (IDOR).
  if (!booking || booking.property.ownerId !== user.id) {
    return { error: fr.common.erreurInconnue };
  }
  if (booking.paymentMode !== "SUR_PLACE" || booking.status !== "EN_ATTENTE_ACCEPTATION") {
    return { error: fr.booking.demandeIndisponible };
  }
  if (booking.expiresAt && booking.expiresAt < new Date()) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "ANNULEE", expiresAt: null },
    });
    return { error: fr.booking.demandeExpiree };
  }

  const dueAt = new Date(booking.checkOut.getTime() + HOST_INVOICE_DUE_DAYS * DAY);

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMEE",
        escrow: "AUCUN",
        amountPaid: 0,
        depositAmount: 0,
        paidAt: new Date(),
        expiresAt: null,
      },
    }),
    prisma.hostInvoice.create({
      data: {
        bookingId: booking.id,
        hostId: user.id,
        amount: booking.serviceFee,
        dueAt,
      },
    }),
  ]);

  await logAudit({
    action: "CASH_BOOKING_ACCEPTED",
    userId: user.id,
    success: true,
    metadata: { bookingId: booking.id },
  });
  await logAudit({
    action: "HOST_INVOICE_GENERATED",
    userId: user.id,
    success: true,
    metadata: { bookingId: booking.id, amount: booking.serviceFee, dueAt: dueAt.toISOString() },
  });

  await notifyBookingConfirmed(booking.id);

  revalidatePath("/dashboard/reservations");
  revalidatePath(`/annonce/${booking.property.slug}`);
  return { success: fr.booking.demandeAcceptee };
}

/** Refus hôte d'une demande Rail 2 — libère les dates, aucune HostInvoice générée. */
export async function declineCashBookingAction(
  _prev: CashBookingResponseState,
  formData: FormData
): Promise<CashBookingResponseState> {
  const fr = await getT();
  const user = await requireUser();

  const parsed = cashBookingIdSchema.safeParse({ bookingId: formData.get("bookingId") });
  if (!parsed.success) return { error: fr.common.erreurInconnue };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: {
      id: true,
      status: true,
      paymentMode: true,
      property: { select: { ownerId: true, slug: true } },
    },
  });

  if (!booking || booking.property.ownerId !== user.id) {
    return { error: fr.common.erreurInconnue };
  }
  if (booking.paymentMode !== "SUR_PLACE" || booking.status !== "EN_ATTENTE_ACCEPTATION") {
    return { error: fr.booking.demandeIndisponible };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "ANNULEE", expiresAt: null },
  });

  await logAudit({
    action: "CASH_BOOKING_DECLINED",
    userId: user.id,
    success: true,
    metadata: { bookingId: booking.id },
  });

  await notifyCashBookingDeclined(booking.id);

  revalidatePath("/dashboard/reservations");
  revalidatePath(`/annonce/${booking.property.slug}`);
  return { success: fr.booking.demandeRefusee };
}

export type NoShowReportState = { error?: string; success?: string } | undefined;

/**
 * Signalement de no-show par l'hôte sur une réservation Rail 2 confirmée dont
 * le check-in est passé. Bascule la réservation en TERMINEE — statut déjà
 * défini dans BOOKING_STATUSES mais jamais écrit ailleurs dans le code
 * (uniquement lu défensivement, ex. submitReviewAction) — ET applique la
 * suspension progressive existante au voyageur (src/lib/suspension.ts),
 * seul levier dissuasif en l'absence de garantie financière en Rail 2. La
 * transition CONFIRMEE → TERMINEE sert AUSSI de garde d'idempotence (via
 * updateMany conditionné) : un second signalement ne trouve plus la
 * réservation en CONFIRMEE, pas besoin d'un champ dédié.
 */
export async function reportNoShowAction(
  _prev: NoShowReportState,
  formData: FormData
): Promise<NoShowReportState> {
  const fr = await getT();
  const user = await requireUser();

  const parsed = cashBookingIdSchema.safeParse({ bookingId: formData.get("bookingId") });
  if (!parsed.success) return { error: fr.common.erreurInconnue };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: {
      id: true,
      status: true,
      paymentMode: true,
      checkIn: true,
      guestId: true,
      property: { select: { ownerId: true } },
    },
  });

  if (!booking || booking.property.ownerId !== user.id) {
    return { error: fr.common.erreurInconnue };
  }
  if (
    booking.paymentMode !== "SUR_PLACE" ||
    booking.status !== "CONFIRMEE" ||
    booking.checkIn.getTime() > Date.now()
  ) {
    return { error: fr.booking.noShowIndisponible };
  }

  const updated = await prisma.booking.updateMany({
    where: { id: booking.id, status: "CONFIRMEE" },
    data: { status: "TERMINEE" },
  });
  // Concurrence (double clic) : déjà traité par une requête précédente.
  if (updated.count === 0) return { error: fr.booking.noShowIndisponible };

  await applySuspension(booking.guestId, "BOOKING_NO_SHOW", { bookingId: booking.id });

  await logAudit({
    action: "BOOKING_NO_SHOW_REPORTED",
    userId: user.id,
    success: true,
    metadata: { bookingId: booking.id, guestId: booking.guestId },
  });

  revalidatePath("/dashboard/reservations");
  return { success: fr.booking.noShowSignale };
}
