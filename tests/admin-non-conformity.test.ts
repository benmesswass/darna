/**
 * LANCEMENT_ROADMAP.md §L5.3 — garantie non-conformité, volet admin.
 * Un signalement voyageur (RECU) n'est jamais un remboursement automatique :
 * un admin tranche. Valider pose Booking.refundAmount ET fait passer le
 * dossier à VALIDE dans LA MÊME transaction (comme creditRefundAction, §L5.2)
 * — jamais l'un sans l'autre. Les deux actions sont idempotentes (updateMany
 * conditionné à status: "RECU") — un double clic ne traite jamais deux fois
 * le même dossier.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    nonConformityReport: { findUnique: vi.fn(), updateMany: vi.fn() },
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
  notifyNonConformityValidated: vi.fn(),
  notifyNonConformityRejected: vi.fn(),
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

import {
  validateNonConformityReportAction,
  rejectNonConformityReportAction,
} from "@/actions/admin";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { notifyNonConformityValidated, notifyNonConformityRejected } from "@/lib/notification-center";

const reportFindUnique = prisma.nonConformityReport.findUnique as unknown as Mock;
const reportUpdateMany = prisma.nonConformityReport.updateMany as unknown as Mock;
const txRun = prisma.$transaction as unknown as Mock;
const requireAdminMock = requireAdmin as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;
const notifyValidatedMock = notifyNonConformityValidated as unknown as Mock;
const notifyRejectedMock = notifyNonConformityRejected as unknown as Mock;

const ADMIN = { id: "admin-1", role: "ADMIN" };
const REPORT_ID = "clreport00000000000000001";
const BOOKING_ID = "clbooking0000000000000001";

function reportIdForm(): FormData {
  const fd = new FormData();
  fd.set("reportId", REPORT_ID);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue(ADMIN);
});

describe("validateNonConformityReportAction", () => {
  it("pose le remboursement ET valide le dossier dans la même transaction", async () => {
    reportFindUnique.mockResolvedValue({
      id: REPORT_ID,
      status: "RECU",
      booking: { id: BOOKING_ID, amountPaid: 45 },
    });
    const tx = {
      nonConformityReport: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      booking: { update: vi.fn().mockResolvedValue({}) },
    };
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

    await validateNonConformityReportAction(reportIdForm());

    expect(tx.nonConformityReport.updateMany).toHaveBeenCalledWith({
      where: { id: REPORT_ID, status: "RECU" },
      data: { status: "VALIDE", reviewedAt: expect.any(Date), reviewedById: ADMIN.id },
    });
    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: BOOKING_ID },
      data: { refundAmount: 45 },
    });
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "NON_CONFORMITY_VALIDATED",
        metadata: expect.objectContaining({ reportId: REPORT_ID, bookingId: BOOKING_ID, refundAmount: 45 }),
      })
    );
    expect(notifyValidatedMock).toHaveBeenCalledWith(BOOKING_ID);
  });

  it("Rail 2 (SUR_PLACE) : amountPaid=0 → refundAmount posé à null, jamais 0 (pas de ligne fantôme)", async () => {
    reportFindUnique.mockResolvedValue({
      id: REPORT_ID,
      status: "RECU",
      booking: { id: BOOKING_ID, amountPaid: 0 },
    });
    const tx = {
      nonConformityReport: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      booking: { update: vi.fn().mockResolvedValue({}) },
    };
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

    await validateNonConformityReportAction(reportIdForm());

    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: BOOKING_ID },
      data: { refundAmount: null },
    });
  });

  it("idempotent : si la transaction ne trouve plus la ligne RECU, aucun remboursement posé", async () => {
    reportFindUnique.mockResolvedValue({
      id: REPORT_ID,
      status: "RECU",
      booking: { id: BOOKING_ID, amountPaid: 45 },
    });
    const tx = {
      nonConformityReport: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      booking: { update: vi.fn() },
    };
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));

    await validateNonConformityReportAction(reportIdForm());

    expect(tx.booking.update).not.toHaveBeenCalled();
    expect(logAuditMock).not.toHaveBeenCalled();
    expect(notifyValidatedMock).not.toHaveBeenCalled();
  });

  it("ne fait rien pour un dossier déjà traité (VALIDE/REJETE) ou introuvable", async () => {
    reportFindUnique.mockResolvedValue({
      id: REPORT_ID,
      status: "VALIDE",
      booking: { id: BOOKING_ID, amountPaid: 45 },
    });

    await validateNonConformityReportAction(reportIdForm());

    expect(txRun).not.toHaveBeenCalled();
  });
});

describe("rejectNonConformityReportAction", () => {
  it("rejette le dossier et journalise NON_CONFORMITY_REJECTED", async () => {
    reportFindUnique.mockResolvedValue({ id: REPORT_ID, status: "RECU", bookingId: BOOKING_ID });
    reportUpdateMany.mockResolvedValue({ count: 1 });

    await rejectNonConformityReportAction(reportIdForm());

    expect(reportUpdateMany).toHaveBeenCalledWith({
      where: { id: REPORT_ID, status: "RECU" },
      data: { status: "REJETE", reviewedAt: expect.any(Date), reviewedById: ADMIN.id },
    });
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "NON_CONFORMITY_REJECTED",
        metadata: { reportId: REPORT_ID, bookingId: BOOKING_ID },
      })
    );
    expect(notifyRejectedMock).toHaveBeenCalledWith(BOOKING_ID);
  });

  it("idempotent : un second appel (déjà traité) ne journalise rien de plus", async () => {
    reportFindUnique.mockResolvedValue({ id: REPORT_ID, status: "RECU", bookingId: BOOKING_ID });
    reportUpdateMany.mockResolvedValue({ count: 0 });

    await rejectNonConformityReportAction(reportIdForm());

    expect(logAuditMock).not.toHaveBeenCalled();
    expect(notifyRejectedMock).not.toHaveBeenCalled();
  });

  it("ne fait rien pour un dossier déjà traité ou introuvable", async () => {
    reportFindUnique.mockResolvedValue({ id: REPORT_ID, status: "REJETE", bookingId: BOOKING_ID });

    await rejectNonConformityReportAction(reportIdForm());

    expect(reportUpdateMany).not.toHaveBeenCalled();
  });
});
