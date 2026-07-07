/**
 * AH7 (ANNULATION_HOTE_ROADMAP.md / QA_ROADMAP.md §3, D8-D9) — durcissement
 * sécurité de l'annulation hôte.
 *
 * Prouve : IDOR (un hôte ne peut annuler que ses propres réservations),
 * idempotence (une 2e annulation sur une réservation déjà annulée échoue
 * proprement sans double sanction), et non-bypass du palier de blocage
 * (recalculé serveur depuis le délai RÉEL avant check-in, jamais depuis un
 * champ client — le formulaire n'envoie que bookingId).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: vi.fn(), updateMany: vi.fn() },
    property: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn(), getSessionUser: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/suspension", () => ({
  isSuspended: vi.fn(() => false),
  applySuspension: vi.fn().mockResolvedValue({ level: 1, until: null }),
}));
vi.mock("@/lib/notification-center", () => ({
  notifyBookingCancelled: vi.fn(),
  notifyBookingCancelledByHost: vi.fn(),
  notifyBookingConfirmed: vi.fn(),
  notifyCashBookingDeclined: vi.fn(),
  notifyCashBookingRequested: vi.fn(),
  notifyGuestReviewReceived: vi.fn(),
  notifyReviewReceived: vi.fn(),
}));
vi.mock("@/lib/rebooking-discount", () => ({
  claimRebookingDiscount: vi.fn(),
  computeRebookingDiscount: vi.fn(),
  isRebookingDiscountValid: vi.fn(),
}));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => false),
  initKonnectPayment: vi.fn(),
  signKonnectWebhook: vi.fn(),
}));
vi.mock("@/lib/notifications", () => ({ sendBookingConfirmationEmail: vi.fn() }));
vi.mock("@/lib/listings", () => ({ recomputePropertyRating: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { champsRequis: "Champs requis.", erreurInconnue: "Erreur inconnue." },
    booking: {
      annulationImpossible: "Cette réservation ne peut plus être annulée.",
      annulationHoteConfirmee: "Réservation annulée, voyageur remboursé.",
      datesIndisponibles: "Dates indisponibles.",
      datesInvalides: "Dates invalides.",
      verifRequise: "Vérification requise.",
      compteSuspendu: "Compte suspendu.",
      proprietaireImpossible: "Impossible de réserver son propre logement.",
      capaciteDepassee: (n: number) => `Capacité dépassée (${n}).`,
    },
  }),
}));

import {
  hostCancelBookingAction,
  createBookingAction,
  quoteBookingAction,
} from "@/actions/bookings";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { applySuspension } from "@/lib/suspension";

const bookingFindUnique = prisma.booking.findUnique as unknown as Mock;
const bookingUpdateMany = prisma.booking.updateMany as unknown as Mock;
const propertyUpdate = prisma.property.update as unknown as Mock;
const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const applySuspensionMock = applySuspension as unknown as Mock;

const DAY = 24 * 60 * 60 * 1000;
const HOST_A = { id: "host-a" };
const HOST_B = { id: "host-b" }; // autre hôte, PAS propriétaire de l'annonce
const BOOKING_ID = "clbooking0000000000000001";
const PROPERTY_ID = "clproperty000000000000001";

function idForm(): FormData {
  const fd = new FormData();
  fd.set("bookingId", BOOKING_ID);
  return fd;
}

function confirmedBooking(daysUntilCheckIn: number) {
  return {
    id: BOOKING_ID,
    status: "CONFIRMEE",
    checkIn: new Date(Date.now() + daysUntilCheckIn * DAY),
    totalPrice: 500,
    property: { id: PROPERTY_ID, ownerId: HOST_A.id, slug: "villa-hammamet-abc123" },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  applySuspensionMock.mockResolvedValue({ level: 1, until: null });
  bookingUpdateMany.mockResolvedValue({ count: 1 });
  propertyUpdate.mockResolvedValue({});
});

describe("hostCancelBookingAction — IDOR (D8)", () => {
  it("refuse qu'un autre hôte annule une réservation qui ne lui appartient pas", async () => {
    requireUserMock.mockResolvedValue(HOST_B);
    bookingFindUnique.mockResolvedValue(confirmedBooking(20));

    const result = await hostCancelBookingAction(undefined, idForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(bookingUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
    expect(applySuspensionMock).not.toHaveBeenCalled();
  });

  it("autorise le propriétaire réel à annuler (contrôle positif)", async () => {
    requireUserMock.mockResolvedValue(HOST_A);
    bookingFindUnique.mockResolvedValue(confirmedBooking(20));

    const result = await hostCancelBookingAction(undefined, idForm());

    expect(result).toEqual({ success: "Réservation annulée, voyageur remboursé." });
    expect(bookingUpdateMany).toHaveBeenCalledTimes(1);
    expect(applySuspensionMock).toHaveBeenCalledWith(
      HOST_A.id,
      "HOST_CANCELLED_BOOKING",
      expect.objectContaining({ bookingId: BOOKING_ID })
    );
  });
});

describe("hostCancelBookingAction — idempotence (D9)", () => {
  it("une 2e annulation sur une réservation déjà annulée échoue sans double sanction", async () => {
    requireUserMock.mockResolvedValue(HOST_A);
    // La réservation est déjà ANNULEE en base (1re annulation déjà traitée) :
    // le contrôle explicite `status !== "CONFIRMEE"` la rejette AVANT même
    // d'atteindre le updateMany (garde d'idempotence à deux niveaux).
    bookingFindUnique.mockResolvedValue({ ...confirmedBooking(20), status: "ANNULEE" });

    const result = await hostCancelBookingAction(undefined, idForm());

    expect(result).toEqual({ error: "Cette réservation ne peut plus être annulée." });
    expect(bookingUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
    expect(applySuspensionMock).not.toHaveBeenCalled();
  });

  it("si le updateMany ne trouve plus la ligne dans l'état CONFIRMEE (course), échoue sans effet de bord", async () => {
    requireUserMock.mockResolvedValue(HOST_A);
    bookingFindUnique.mockResolvedValue(confirmedBooking(20));
    // Simule une course : la ligne a changé d'état entre le findUnique et le
    // updateMany (2e requête concurrente arrivée juste avant).
    bookingUpdateMany.mockResolvedValue({ count: 0 });

    const result = await hostCancelBookingAction(undefined, idForm());

    expect(result).toEqual({ error: "Cette réservation ne peut plus être annulée." });
    expect(propertyUpdate).not.toHaveBeenCalled();
    expect(applySuspensionMock).not.toHaveBeenCalled();
  });
});

describe("hostCancelBookingAction — palier de blocage non-bypassable (D10)", () => {
  // Le formulaire n'envoie que bookingId (cf. cancelSchema) : aucun champ
  // "durée de blocage" n'existe côté client à falsifier. Le palier est
  // entièrement recalculé serveur depuis `booking.checkIn` (lu en base).
  it.each([
    [40, 3], // ≥ 30 jours avant check-in → 3 jours de blocage
    [15, 15], // entre 7 et 30 jours → 15 jours
    [3, 30], // < 7 jours → 30 jours
  ])("check-in dans %i jours → blocage de %i jours", async (daysUntilCheckIn, expectedBlockDays) => {
    requireUserMock.mockResolvedValue(HOST_A);
    bookingFindUnique.mockResolvedValue(confirmedBooking(daysUntilCheckIn));

    await hostCancelBookingAction(undefined, idForm());

    expect(bookingUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hostCancelBlockDays: expectedBlockDays }),
      })
    );
    expect(propertyUpdate).toHaveBeenCalledTimes(1);
    const untilArg = propertyUpdate.mock.calls[0][0].data.cancelBlockedUntil as Date;
    const expectedMs = Date.now() + expectedBlockDays * DAY;
    // Tolérance de quelques secondes (temps d'exécution du test).
    expect(Math.abs(untilArg.getTime() - expectedMs)).toBeLessThan(5000);
  });
});

describe("createBookingAction — annonce bloquée inaccessible même via lien direct (D11)", () => {
  const verifiedGuest = {
    id: "guest-1",
    role: "VOYAGEUR",
    kycStatus: "VERIFIE",
    phoneVerified: true,
    emailVerified: true,
  };

  function ymd(offset: number): string {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  function bookingForm(): FormData {
    const fd = new FormData();
    fd.set("slug", "villa-hammamet-abc123");
    fd.set("arrivee", ymd(10));
    fd.set("depart", ymd(12));
    fd.set("voyageurs", "2");
    return fd;
  }

  beforeEach(() => {
    requireUserMock.mockResolvedValue(verifiedGuest);
  });

  it("refuse une réservation sur une annonce bloquée par une annulation hôte récente", async () => {
    propertyFindUnique.mockResolvedValue({
      id: PROPERTY_ID,
      type: "SEJOUR",
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 30 * DAY),
      price: 100,
      stay: { maxGuests: 4 },
      ownerId: "host-a",
      cashPaymentEnabled: false,
      // Blocage encore actif (dans le futur) : refus même en tapant l'URL
      // directement, pas seulement masqué de la recherche (§AH2).
      cancelBlockedUntil: new Date(Date.now() + 5 * DAY),
    });

    const result = await createBookingAction(undefined, bookingForm());

    expect(result).toEqual({ error: "Dates indisponibles." });
  });

  it("autorise la réservation une fois le blocage expiré (contrôle positif)", async () => {
    propertyFindUnique.mockResolvedValue({
      id: PROPERTY_ID,
      type: "SEJOUR",
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 30 * DAY),
      price: 100,
      stay: { maxGuests: 4 },
      ownerId: "host-a",
      cashPaymentEnabled: false,
      cancelBlockedUntil: new Date(Date.now() - DAY), // expiré hier
    });
    const create = vi.fn().mockResolvedValue({ id: BOOKING_ID, totalPrice: 216 });
    (prisma.$transaction as unknown as Mock).mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          booking: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), create, update: vi.fn() },
          property: { findFirst: vi.fn().mockResolvedValue(null) },
        })
    );

    const result = await createBookingAction(undefined, bookingForm());

    expect(result).toBeUndefined(); // succès → redirect (mocké)
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("le DEVIS (quoteBookingAction) signale aussi le blocage — pas seulement la soumission finale", async () => {
    // Trouvé en testant en direct (script AH7) : quoteBookingAction ne
    // vérifiait pas cancelBlockedUntil, donc le récapitulatif de prix
    // s'affichait normalement sur une annonce bloquée — le refus n'arrivait
    // qu'au clic « Continuer vers le paiement » (createBookingAction).
    // Corrigé pour que le devis prévienne dès le choix des dates.
    propertyFindUnique.mockResolvedValue({
      id: PROPERTY_ID,
      type: "SEJOUR",
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 30 * DAY),
      price: 100,
      stay: { maxGuests: 4 },
      cancelBlockedUntil: new Date(Date.now() + 5 * DAY),
    });

    const result = await quoteBookingAction({
      slug: "villa-hammamet-abc123",
      arrivee: ymd(10),
      depart: ymd(12),
      voyageurs: 2,
    });

    expect(result).toEqual({ ok: false, error: "Dates indisponibles." });
  });
});
