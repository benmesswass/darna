/**
 * CROISSANCE_ROADMAP.md §CR4 — restitution du crédit dépensé quand la résa
 * associée est annulée (voyageur `cancelBookingAction` ou hôte
 * `hostCancelBookingAction`). `refundCreditForBooking` (testé en isolation
 * dans credits.test.ts) est mocké ici : on prouve seulement l'INTÉGRATION —
 * appelé avec le bon bookingId après l'annulation, et surtout, jamais
 * bloquant : l'annulation (déjà actée) doit réussir même si le remboursement
 * de crédit échoue.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    property: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/suspension", () => ({
  isSuspended: vi.fn(() => false),
  applySuspension: vi.fn().mockResolvedValue({ level: 1, until: null }),
}));
vi.mock("@/lib/notification-center", () => ({
  notifyBookingCancelled: vi.fn(),
  notifyBookingCancelledByHost: vi.fn(),
}));
vi.mock("@/lib/notifications", () => ({ sendBookingCancelledByHostEmail: vi.fn() }));
vi.mock("@/lib/credits", () => ({ refundCreditForBooking: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { champsRequis: "Champs requis.", erreurInconnue: "Erreur inconnue." },
    booking: {
      annulationImpossible: "Annulation impossible.",
      annulationConfirmee: "Réservation annulée.",
      annulationHoteConfirmee: "Réservation annulée, voyageur remboursé.",
    },
  }),
}));

import { cancelBookingAction, hostCancelBookingAction } from "@/actions/bookings";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { refundCreditForBooking } from "@/lib/credits";
import { logStructured } from "@/lib/audit";

const bookingFindUnique = prisma.booking.findUnique as unknown as Mock;
const bookingUpdate = prisma.booking.update as unknown as Mock;
const propertyUpdate = prisma.property.update as unknown as Mock;
const txRun = prisma.$transaction as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const refundMock = refundCreditForBooking as unknown as Mock;
const logStructuredMock = logStructured as unknown as Mock;

const DAY = 24 * 60 * 60 * 1000;
const GUEST_ID = "guest-1";
const HOST_ID = "host-1";
const BOOKING_ID = "clbooking0000000000000001";

function cancelForm(): FormData {
  const fd = new FormData();
  fd.set("bookingId", BOOKING_ID);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  refundMock.mockResolvedValue(undefined);
});

describe("cancelBookingAction (voyageur) — restitution crédit (§CR4)", () => {
  beforeEach(() => {
    requireUserMock.mockResolvedValue({ id: GUEST_ID });
    bookingFindUnique.mockResolvedValue({
      id: BOOKING_ID,
      guestId: GUEST_ID,
      status: "CONFIRMEE",
      checkIn: new Date(Date.now() + 10 * DAY),
      serviceFee: 40,
      amountPaid: 500,
      createdAt: new Date(),
      property: { slug: "villa", cancelPolicy: "FLEXIBLE" },
    });
    bookingUpdate.mockResolvedValue({});
  });

  it("appelle refundCreditForBooking avec le bon bookingId après l'annulation", async () => {
    const res = await cancelBookingAction(undefined, cancelForm());

    expect(res).toEqual({ success: "Réservation annulée." });
    expect(refundMock).toHaveBeenCalledWith(BOOKING_ID);
  });

  it("l'annulation réussit MÊME SI la restitution du crédit échoue (best-effort)", async () => {
    refundMock.mockRejectedValue(new Error("db down"));

    const res = await cancelBookingAction(undefined, cancelForm());

    expect(res).toEqual({ success: "Réservation annulée." });
    expect(logStructuredMock).toHaveBeenCalledWith(
      "error",
      "credits.refund_failed",
      expect.objectContaining({ bookingId: BOOKING_ID })
    );
  });
});

describe("hostCancelBookingAction (hôte) — restitution crédit (§CR4)", () => {
  beforeEach(() => {
    requireUserMock.mockResolvedValue({ id: HOST_ID });
    bookingFindUnique.mockResolvedValue({
      id: BOOKING_ID,
      status: "CONFIRMEE",
      checkIn: new Date(Date.now() + 10 * DAY),
      totalPrice: 500,
      amountPaid: 500,
      property: { id: "prop-1", ownerId: HOST_ID, slug: "villa" },
    });
    propertyUpdate.mockResolvedValue({});
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        booking: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        property: { update: vi.fn().mockResolvedValue({}) },
      })
    );
  });

  it("appelle refundCreditForBooking avec le bon bookingId après l'annulation hôte", async () => {
    const res = await hostCancelBookingAction(undefined, cancelForm());

    expect(res).toEqual({ success: "Réservation annulée, voyageur remboursé." });
    expect(refundMock).toHaveBeenCalledWith(BOOKING_ID);
  });

  it("l'annulation hôte réussit MÊME SI la restitution du crédit échoue (best-effort)", async () => {
    refundMock.mockRejectedValue(new Error("db down"));

    const res = await hostCancelBookingAction(undefined, cancelForm());

    expect(res).toEqual({ success: "Réservation annulée, voyageur remboursé." });
    expect(logStructuredMock).toHaveBeenCalledWith(
      "error",
      "credits.refund_failed",
      expect.objectContaining({ bookingId: BOOKING_ID })
    );
  });
});
