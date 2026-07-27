/**
 * LANCEMENT_ROADMAP.md §L5.2 — remboursement des frais après annulation.
 * L'API Konnect n'a pas de remboursement programmatique (CLAUDE.md §AHC8) :
 * un admin règle manuellement, en crédits Darna (préféré) ou par virement.
 * Les deux actions sont idempotentes (updateMany conditionné à
 * refundPaidAt: null) — un double clic ne règle jamais deux fois.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/session", () => ({
  requireAdmin: vi.fn(),
  requireWakilOrAdmin: vi.fn(),
}));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/credits", () => ({ issueCredit: vi.fn() }));
vi.mock("@/lib/saved-search", () => ({ notifyMatchingSavedSearches: vi.fn() }));
vi.mock("@/lib/notification-center", () => ({
  notifyAgencyQuotaReached: vi.fn(),
  notifyAgencyOutOfVerificationCredits: vi.fn(),
  notifyHostVerificationPaymentRequired: vi.fn(),
  notifyHostInvoiceReminder: vi.fn(),
}));
vi.mock("@/lib/notifications", () => ({ sendHostInvoiceReminderEmail: vi.fn() }));
vi.mock("@/lib/subscriptions", () => ({
  activeListingsLimit: vi.fn(),
  countActiveListings: vi.fn(),
}));
vi.mock("@/lib/verification-credits", () => ({ consumeVerificationCredit: vi.fn() }));
vi.mock("@/lib/suspension", () => ({ applySuspension: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({ getT: vi.fn().mockResolvedValue({}) }));

import { markRefundPaidAction, creditRefundAction } from "@/actions/admin";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { issueCredit } from "@/lib/credits";

const bookingFindUnique = prisma.booking.findUnique as unknown as Mock;
const bookingUpdateMany = prisma.booking.updateMany as unknown as Mock;
const txRun = prisma.$transaction as unknown as Mock;
const requireAdminMock = requireAdmin as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;
const issueCreditMock = issueCredit as unknown as Mock;

const ADMIN = { id: "admin-1", role: "ADMIN" };
const BOOKING_ID = "clbooking0000000000000001";
const GUEST_ID = "clguest00000000000000001";

function bookingIdForm(): FormData {
  const fd = new FormData();
  fd.set("bookingId", BOOKING_ID);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue(ADMIN);
});

describe("markRefundPaidAction — virement manuel", () => {
  it("marque le remboursement réglé et journalise REFUND_MARKED", async () => {
    bookingFindUnique.mockResolvedValue({ id: BOOKING_ID, refundAmount: 45, refundPaidAt: null });
    bookingUpdateMany.mockResolvedValue({ count: 1 });

    await markRefundPaidAction(bookingIdForm());

    expect(bookingUpdateMany).toHaveBeenCalledWith({
      where: { id: BOOKING_ID, refundPaidAt: null },
      data: { refundPaidAt: expect.any(Date) },
    });
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "REFUND_MARKED",
        userId: ADMIN.id,
        metadata: expect.objectContaining({ bookingId: BOOKING_ID, refundAmount: 45, method: "virement" }),
      })
    );
    expect(issueCreditMock).not.toHaveBeenCalled();
  });

  it("ne fait rien pour une réservation sans refundAmount", async () => {
    bookingFindUnique.mockResolvedValue({ id: BOOKING_ID, refundAmount: null, refundPaidAt: null });

    await markRefundPaidAction(bookingIdForm());

    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("idempotent : un second appel (déjà réglé) ne journalise rien de plus", async () => {
    bookingFindUnique.mockResolvedValue({ id: BOOKING_ID, refundAmount: 45, refundPaidAt: null });
    bookingUpdateMany.mockResolvedValue({ count: 0 }); // déjà réglé entre-temps

    await markRefundPaidAction(bookingIdForm());

    expect(logAuditMock).not.toHaveBeenCalled();
  });

  it("ne fait rien si déjà marqué réglé (refundPaidAt déjà posé)", async () => {
    bookingFindUnique.mockResolvedValue({
      id: BOOKING_ID,
      refundAmount: 45,
      refundPaidAt: new Date(),
    });

    await markRefundPaidAction(bookingIdForm());

    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });
});

describe("creditRefundAction — crédit Darna (préféré)", () => {
  it("crédite le compte du voyageur ET marque réglé dans la même transaction", async () => {
    bookingFindUnique.mockResolvedValue({
      id: BOOKING_ID,
      guestId: GUEST_ID,
      refundAmount: 45,
      refundPaidAt: null,
    });
    const tx = { booking: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) } };
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

    await creditRefundAction(bookingIdForm());

    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: { id: BOOKING_ID, refundPaidAt: null },
      data: { refundPaidAt: expect.any(Date) },
    });
    expect(issueCreditMock).toHaveBeenCalledWith(
      {
        userId: GUEST_ID,
        amount: 45,
        motif: "REMBOURSEMENT_FRAIS_ANNULATION",
        bookingId: BOOKING_ID,
      },
      tx
    );
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "REFUND_MARKED",
        metadata: expect.objectContaining({ method: "credit", creditedUserId: GUEST_ID }),
      })
    );
  });

  it("idempotent : si la transaction ne trouve plus la ligne EN_ATTENTE, aucun crédit émis", async () => {
    bookingFindUnique.mockResolvedValue({
      id: BOOKING_ID,
      guestId: GUEST_ID,
      refundAmount: 45,
      refundPaidAt: null,
    });
    const tx = { booking: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) } };
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

    await creditRefundAction(bookingIdForm());

    expect(issueCreditMock).not.toHaveBeenCalled();
    expect(logAuditMock).not.toHaveBeenCalled();
  });

  it("ne fait rien pour une réservation sans refundAmount (IDOR/état incohérent)", async () => {
    bookingFindUnique.mockResolvedValue({
      id: BOOKING_ID,
      guestId: GUEST_ID,
      refundAmount: 0,
      refundPaidAt: null,
    });

    await creditRefundAction(bookingIdForm());

    expect(txRun).not.toHaveBeenCalled();
    expect(issueCreditMock).not.toHaveBeenCalled();
  });
});
