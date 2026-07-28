/**
 * LANCEMENT_ROADMAP.md §L5.4 — garantie no-show hôte (rail ESCROW,
 * DISTINCTE de reportNoShowAction/Rail 2 qui n'indemnise pas). Fenêtre
 * checkIn→checkIn+48h ; IDOR (booking.property.ownerId === user.id) ;
 * idempotence via `noShowIndemnityClaimedAt` (PAS le statut, qui peut aussi
 * devenir TERMINEE via la complétion paresseuse normale) ; plafond mensuel
 * anti-abus ; crédit + suspension posés dans la même transaction.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  },
}));
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
  notifyNonConformityReported: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/product-events", () => ({ logProductEvent: vi.fn() }));
vi.mock("@/lib/credits", () => ({ issueCredit: vi.fn() }));
vi.mock("@/lib/suspension", () => ({ isSuspended: vi.fn(), applySuspension: vi.fn() }));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => false),
  initKonnectPayment: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    booking: {
      noShowIndisponible: "Cette action n'est pas disponible pour cette réservation.",
      noShowIndemnitePlafondAtteint:
        "Vous avez atteint le nombre maximum d'indemnités no-show pour ce mois.",
      noShowIndemniteVersee: (montant: number) =>
        montant > 0
          ? `No-show déclaré — ${montant} TND crédités sur votre compte Darna.`
          : "No-show déclaré.",
    },
    common: { erreurInconnue: "Erreur inconnue.", champsRequis: "Champs requis." },
  }),
}));

import { claimNoShowIndemnityAction } from "@/actions/bookings";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { issueCredit } from "@/lib/credits";
import { applySuspension } from "@/lib/suspension";

const bookingFindUnique = prisma.booking.findUnique as unknown as Mock;
const bookingCount = prisma.booking.count as unknown as Mock;
const txRun = prisma.$transaction as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;
const issueCreditMock = issueCredit as unknown as Mock;
const applySuspensionMock = applySuspension as unknown as Mock;

const HOST = { id: "host-owner" };
const ATTACKER = { id: "host-attacker" };
const GUEST_ID = "clguest00000000000000001";
const BOOKING_ID = "clbooking0000000000000001";
const HOUR = 60 * 60 * 1000;

function claimForm(): FormData {
  const fd = new FormData();
  fd.set("bookingId", BOOKING_ID);
  return fd;
}

function booking(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: BOOKING_ID,
    status: "CONFIRMEE",
    paymentMode: "ESCROW",
    checkIn: new Date(Date.now() - 2 * HOUR), // check-in il y a 2h — dans la fenêtre
    guestId: GUEST_ID,
    amountPaid: 45,
    noShowIndemnityClaimedAt: null,
    property: { ownerId: HOST.id },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue(HOST);
  bookingCount.mockResolvedValue(0); // sous le plafond mensuel par défaut
});

describe("claimNoShowIndemnityAction — IDOR", () => {
  it("refuse de réclamer sur la réservation d'un autre hôte", async () => {
    requireUserMock.mockResolvedValue(ATTACKER);
    bookingFindUnique.mockResolvedValue(booking());

    const result = await claimNoShowIndemnityAction(undefined, claimForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(txRun).not.toHaveBeenCalled();
  });
});

describe("claimNoShowIndemnityAction — rail et fenêtre", () => {
  it("refuse sur le rail SUR_PLACE (a son propre mécanisme sans indemnité)", async () => {
    bookingFindUnique.mockResolvedValue(booking({ paymentMode: "SUR_PLACE" }));

    const result = await claimNoShowIndemnityAction(undefined, claimForm());

    expect(result).toEqual({ error: "Cette action n'est pas disponible pour cette réservation." });
    expect(txRun).not.toHaveBeenCalled();
  });

  it("refuse avant le check-in", async () => {
    bookingFindUnique.mockResolvedValue(booking({ checkIn: new Date(Date.now() + HOUR) }));

    const result = await claimNoShowIndemnityAction(undefined, claimForm());

    expect(result).toEqual({ error: "Cette action n'est pas disponible pour cette réservation." });
  });

  it("refuse au-delà de 48h après le check-in", async () => {
    bookingFindUnique.mockResolvedValue(booking({ checkIn: new Date(Date.now() - 49 * HOUR) }));

    const result = await claimNoShowIndemnityAction(undefined, claimForm());

    expect(result).toEqual({ error: "Cette action n'est pas disponible pour cette réservation." });
  });

  it("accepte en statut TERMINEE si toujours dans la fenêtre (complétion paresseuse déjà passée)", async () => {
    bookingFindUnique.mockResolvedValue(booking({ status: "TERMINEE" }));
    const tx = {
      booking: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

    const result = await claimNoShowIndemnityAction(undefined, claimForm());

    expect(result?.success).toBeDefined();
  });

  it("refuse si déjà réclamée (pré-check)", async () => {
    bookingFindUnique.mockResolvedValue(booking({ noShowIndemnityClaimedAt: new Date() }));

    const result = await claimNoShowIndemnityAction(undefined, claimForm());

    expect(result).toEqual({ error: "Cette action n'est pas disponible pour cette réservation." });
    expect(txRun).not.toHaveBeenCalled();
  });
});

describe("claimNoShowIndemnityAction — plafond mensuel anti-abus", () => {
  it("refuse au-delà de NO_SHOW_INDEMNITY_MONTHLY_CAP réclamations ce mois-ci", async () => {
    bookingFindUnique.mockResolvedValue(booking());
    bookingCount.mockResolvedValue(3);

    const result = await claimNoShowIndemnityAction(undefined, claimForm());

    expect(result).toEqual({
      error: "Vous avez atteint le nombre maximum d'indemnités no-show pour ce mois.",
    });
    expect(txRun).not.toHaveBeenCalled();
  });

  it("interroge le plafond sur TOUTES les annonces de l'hôte (pas juste celle-ci)", async () => {
    bookingFindUnique.mockResolvedValue(booking());
    const tx = { booking: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) } };
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

    await claimNoShowIndemnityAction(undefined, claimForm());

    expect(bookingCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          property: { ownerId: HOST.id },
          noShowIndemnityClaimedAt: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      })
    );
  });
});

describe("claimNoShowIndemnityAction — succès", () => {
  it("crédite l'hôte, suspend le voyageur et journalise, tous dans la même transaction", async () => {
    bookingFindUnique.mockResolvedValue(booking());
    const tx = { booking: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) } };
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

    const result = await claimNoShowIndemnityAction(undefined, claimForm());

    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: { id: BOOKING_ID, noShowIndemnityClaimedAt: null },
      data: { status: "TERMINEE", noShowIndemnityClaimedAt: expect.any(Date) },
    });
    expect(issueCreditMock).toHaveBeenCalledWith(
      { userId: HOST.id, amount: 45, motif: "INDEMNITE_NO_SHOW", bookingId: BOOKING_ID },
      tx
    );
    expect(applySuspensionMock).toHaveBeenCalledWith(
      GUEST_ID,
      "BOOKING_NO_SHOW",
      { bookingId: BOOKING_ID },
      tx
    );
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "NO_SHOW_INDEMNITY_CLAIMED",
        metadata: { bookingId: BOOKING_ID, guestId: GUEST_ID, indemnityAmount: 45 },
      })
    );
    expect(result).toEqual({
      success: "No-show déclaré — 45 TND crédités sur votre compte Darna.",
    });
  });

  it("frais nuls (crédit ayant tout couvert) : suspend et clôt SANS émettre de crédit", async () => {
    bookingFindUnique.mockResolvedValue(booking({ amountPaid: 0 }));
    const tx = { booking: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) } };
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

    const result = await claimNoShowIndemnityAction(undefined, claimForm());

    expect(issueCreditMock).not.toHaveBeenCalled();
    expect(applySuspensionMock).toHaveBeenCalled();
    expect(result).toEqual({ success: "No-show déclaré." });
  });

  it("idempotent : si la transaction ne trouve plus la ligne non-réclamée, aucun effet secondaire", async () => {
    bookingFindUnique.mockResolvedValue(booking());
    const tx = { booking: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) } };
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

    const result = await claimNoShowIndemnityAction(undefined, claimForm());

    expect(issueCreditMock).not.toHaveBeenCalled();
    expect(applySuspensionMock).not.toHaveBeenCalled();
    expect(logAuditMock).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Cette action n'est pas disponible pour cette réservation." });
  });
});
