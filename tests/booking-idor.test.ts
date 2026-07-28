/**
 * D2 (QA_ROADMAP §3) — IDOR sur les réservations.
 *
 * Prouve qu'un utilisateur ne peut PAS agir sur la réservation d'un autre :
 * payer (mock), démarrer un paiement Konnect, ou déposer un avis. Le garde-fou
 * est `booking.guestId === user.id`, relu en base (jamais confiance au client).
 * Chaque négatif est ancré par un contrôle positif (le propriétaire, lui, passe).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    review: { create: vi.fn() },
  },
}));
// L'action recalcule les agrégats d'avis après création : on stub le helper
// (testé ailleurs) pour isoler le contrôle d'autorisation IDOR.
vi.mock("@/lib/listings", () => ({ recomputePropertyRating: vi.fn() }));
vi.mock("@/lib/notifications", () => ({
  sendBookingConfirmationEmail: vi.fn(),
  sendNewBookingHostEmail: vi.fn(),
}));
vi.mock("@/lib/notification-center", () => ({
  notifyBookingConfirmed: vi.fn(),
  notifyBookingCancelled: vi.fn(),
  notifyReviewReceived: vi.fn(),
  notifyGuestReviewReceived: vi.fn(),
  notifyNewBookingReceived: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => false),
  initKonnectPayment: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    booking: {
      datesIndisponibles: "Dates indisponibles.",
      reservationExpiree: "Réservation expirée.",
      paiementKonnectErreur: "Erreur de paiement.",
      annulationImpossible: "Annulation impossible.",
      annulationConfirmee: "Réservation annulée.",
    },
    property: { avisRefuse: "Avis refusé.", avisEnvoye: "Avis envoyé." },
    common: { erreurInconnue: "Erreur inconnue.", champsRequis: "Champs requis." },
  }),
}));

import {
  confirmPaymentAction,
  startKonnectPaymentAction,
  submitReviewAction,
  cancelBookingAction,
} from "@/actions/bookings";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isKonnectEnabled, initKonnectPayment } from "@/lib/konnect";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";

const redirectMock = redirect as unknown as Mock;

const bookingFindUnique = prisma.booking.findUnique as unknown as Mock;
const bookingUpdate = prisma.booking.update as unknown as Mock;
const reviewCreate = prisma.review.create as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const isKonnectEnabledMock = isKonnectEnabled as unknown as Mock;
const initKonnectMock = initKonnectPayment as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;

const OWNER = { id: "guest-owner" }; // voyageur titulaire de la réservation
const ATTACKER = { id: "guest-attacker" }; // autre utilisateur connecté
const BOOKING_ID = "clbooking0000000000000001";

beforeEach(() => {
  vi.clearAllMocks();
  bookingUpdate.mockResolvedValue({});
  reviewCreate.mockResolvedValue({});
});

function idForm(): FormData {
  const fd = new FormData();
  fd.set("bookingId", BOOKING_ID);
  return fd;
}

describe("confirmPaymentAction (paiement mock) — IDOR", () => {
  it("refuse de confirmer la réservation d'un autre utilisateur", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(ATTACKER);
    bookingFindUnique.mockResolvedValue({
      id: BOOKING_ID,
      guestId: OWNER.id,
      status: "EN_ATTENTE",
      expiresAt: new Date(Date.now() + 600_000),
      totalPrice: 216,
    });

    await confirmPaymentAction(idForm());

    expect(bookingUpdate).not.toHaveBeenCalled();
    expect(logAuditMock).not.toHaveBeenCalled();
  });

  it("autorise le voyageur titulaire à confirmer (contrôle positif)", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(OWNER);
    bookingFindUnique.mockResolvedValue({
      id: BOOKING_ID,
      guestId: OWNER.id,
      status: "EN_ATTENTE",
      expiresAt: new Date(Date.now() + 600_000),
      totalPrice: 216,
    });

    await confirmPaymentAction(idForm());

    expect(bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CONFIRMEE" }),
      })
    );
  });
});

describe("startKonnectPaymentAction (paiement réel) — IDOR", () => {
  it("refuse d'initier le paiement de la réservation d'un autre utilisateur", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    requireUserMock.mockResolvedValue(ATTACKER);
    bookingFindUnique.mockResolvedValue({
      id: BOOKING_ID,
      guestId: OWNER.id,
      status: "EN_ATTENTE",
      expiresAt: new Date(Date.now() + 600_000),
      totalPrice: 216,
      property: { title: "Villa" },
    });

    const result = await startKonnectPaymentAction(undefined, idForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(initKonnectMock).not.toHaveBeenCalled();
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("frais intégralement couverts par un crédit (depositAmount=0) : confirme directement, sans appeler Konnect", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    requireUserMock.mockResolvedValue(OWNER);
    bookingFindUnique.mockResolvedValue({
      id: BOOKING_ID,
      guestId: OWNER.id,
      status: "EN_ATTENTE",
      expiresAt: new Date(Date.now() + 600_000),
      totalPrice: 450,
      depositAmount: 0,
      property: { title: "Villa" },
    });
    const bookingUpdateMany = prisma.booking.updateMany as unknown as Mock;
    bookingUpdateMany.mockResolvedValue({ count: 1 });
    // redirect() ne revient jamais côté réel (Next.js) — reproduit ici pour
    // vérifier que la fonction s'arrête bien avant le code Konnect.
    redirectMock.mockImplementationOnce(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(startKonnectPaymentAction(undefined, idForm())).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    expect(initKonnectMock).not.toHaveBeenCalled();
    expect(bookingUpdateMany).toHaveBeenCalledWith({
      where: { id: BOOKING_ID, status: "EN_ATTENTE" },
      data: expect.objectContaining({ status: "CONFIRMEE", amountPaid: 0 }),
    });
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PAYMENT_CONFIRMED", metadata: expect.objectContaining({ amountPaid: 0 }) })
    );
  });
});

describe("submitReviewAction — IDOR", () => {
  function reviewForm(): FormData {
    const fd = new FormData();
    fd.set("bookingId", BOOKING_ID);
    fd.set("proprete", "5");
    fd.set("communication", "5");
    fd.set("conformite", "5");
    fd.set("qualitePrix", "5");
    fd.set("comment", "Séjour vraiment parfait, je recommande.");
    return fd;
  }

  const terminatedBooking = (guestId: string) => ({
    id: BOOKING_ID,
    guestId,
    status: "TERMINEE",
    checkOut: new Date(Date.now() - 24 * 60 * 60 * 1000),
    review: null,
    propertyId: "clproperty000000000000001",
    property: { slug: "villa-hammamet-abc123" },
  });

  it("refuse de noter la réservation d'un autre utilisateur", async () => {
    requireUserMock.mockResolvedValue(ATTACKER);
    bookingFindUnique.mockResolvedValue(terminatedBooking(OWNER.id));

    const result = await submitReviewAction(undefined, reviewForm());

    expect(result).toEqual({ error: "Avis refusé." });
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it("autorise le voyageur titulaire à déposer un avis (contrôle positif)", async () => {
    requireUserMock.mockResolvedValue(OWNER);
    bookingFindUnique.mockResolvedValue(terminatedBooking(OWNER.id));

    const result = await submitReviewAction(undefined, reviewForm());

    expect(result).toEqual({ success: "Avis envoyé." });
    expect(reviewCreate).toHaveBeenCalledTimes(1);
  });
});

describe("cancelBookingAction — IDOR", () => {
  const confirmedBooking = (guestId: string) => ({
    id: BOOKING_ID,
    guestId,
    status: "CONFIRMEE",
    checkIn: new Date(Date.now() + 10 * 86_400_000),
    totalPrice: 300,
    amountPaid: 30, // frais Darna réellement encaissés (§L5.2) — assiette de computeRefund
    createdAt: new Date(Date.now() - 10 * 86_400_000),
    property: { slug: "villa-hammamet", cancelPolicy: "MODEREE" },
    nonConformityReport: null,
  });

  it("refuse d'annuler la réservation d'un autre utilisateur", async () => {
    requireUserMock.mockResolvedValue(ATTACKER);
    bookingFindUnique.mockResolvedValue(confirmedBooking(OWNER.id));

    const result = await cancelBookingAction(undefined, idForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("refuse d'annuler une réservation déjà terminée", async () => {
    requireUserMock.mockResolvedValue(OWNER);
    bookingFindUnique.mockResolvedValue({ ...confirmedBooking(OWNER.id), status: "TERMINEE" });

    const result = await cancelBookingAction(undefined, idForm());

    expect(result).toEqual({ error: "Annulation impossible." });
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("autorise le voyageur titulaire à annuler (contrôle positif)", async () => {
    requireUserMock.mockResolvedValue(OWNER);
    bookingFindUnique.mockResolvedValue(confirmedBooking(OWNER.id));

    const result = await cancelBookingAction(undefined, idForm());

    expect(result).toEqual({ success: "Réservation annulée." });
    expect(bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ANNULEE", escrow: "AUCUN", refundAmount: 30 }),
      })
    );
  });

  // §L5.3 : un dossier de non-conformité déjà ouvert (RECU, VALIDE ou REJETE)
  // bloque l'annulation « libre choix » du voyageur — sinon elle écraserait
  // silencieusement un refundAmount déjà posé par validateNonConformityReportAction
  // (update non conditionné dans cancelBookingAction).
  it("refuse d'annuler si un signalement de non-conformité existe déjà", async () => {
    requireUserMock.mockResolvedValue(OWNER);
    bookingFindUnique.mockResolvedValue({
      ...confirmedBooking(OWNER.id),
      nonConformityReport: { id: "existing-report" },
    });

    const result = await cancelBookingAction(undefined, idForm());

    expect(result).toEqual({ error: "Annulation impossible." });
    expect(bookingUpdate).not.toHaveBeenCalled();
  });
});
