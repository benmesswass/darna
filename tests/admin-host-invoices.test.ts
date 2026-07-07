/**
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP8 — dashboard admin factures : relance
 * manuelle et suspension manuelle. `requireAdmin` (déjà testé ailleurs,
 * cf. permissions-gates.test.ts) est mocké pour résoudre — on isole ici le
 * comportement métier de chaque action.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    hostInvoice: { findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({
  requireAdmin: vi.fn(),
  requireWakilOrAdmin: vi.fn(),
}));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/suspension", () => ({ applySuspension: vi.fn().mockResolvedValue({ level: 1, until: null }) }));
vi.mock("@/lib/notification-center", () => ({
  notifyHostInvoiceReminder: vi.fn(),
  notifyMatchingSavedSearches: vi.fn(),
}));
vi.mock("@/lib/notifications", () => ({ sendHostInvoiceReminderEmail: vi.fn() }));
vi.mock("@/lib/saved-search", () => ({ notifyMatchingSavedSearches: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({ getT: vi.fn().mockResolvedValue({}) }));

import { sendHostInvoiceReminderAction, suspendHostForInvoiceAction } from "@/actions/admin";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { applySuspension } from "@/lib/suspension";
import { notifyHostInvoiceReminder } from "@/lib/notification-center";
import { sendHostInvoiceReminderEmail } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

const invoiceFindUnique = prisma.hostInvoice.findUnique as unknown as Mock;
const invoiceUpdate = prisma.hostInvoice.update as unknown as Mock;
const requireAdminMock = requireAdmin as unknown as Mock;
const applySuspensionMock = applySuspension as unknown as Mock;
const notifyMock = notifyHostInvoiceReminder as unknown as Mock;
const emailMock = sendHostInvoiceReminderEmail as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;

const ADMIN = { id: "admin-1", role: "ADMIN" };
const INVOICE_ID = "clinvoice000000000000001";
const HOST_ID = "clhost0000000000000000001";

function reminderForm(): FormData {
  const fd = new FormData();
  fd.set("invoiceId", INVOICE_ID);
  return fd;
}

function suspendForm(): FormData {
  const fd = new FormData();
  fd.set("hostId", HOST_ID);
  fd.set("invoiceId", INVOICE_ID);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue(ADMIN);
  invoiceUpdate.mockResolvedValue({});
  applySuspensionMock.mockResolvedValue({ level: 1, until: null });
});

describe("sendHostInvoiceReminderAction", () => {
  it("envoie la relance (notif + e-mail) et marque lastReminderAt pour une facture en attente", async () => {
    invoiceFindUnique.mockResolvedValue({ status: "EN_ATTENTE" });

    await sendHostInvoiceReminderAction(reminderForm());

    expect(notifyMock).toHaveBeenCalledWith(INVOICE_ID);
    expect(emailMock).toHaveBeenCalledWith(INVOICE_ID);
    expect(invoiceUpdate).toHaveBeenCalledWith({
      where: { id: INVOICE_ID },
      data: { lastReminderAt: expect.any(Date) },
    });
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "HOST_INVOICE_REMINDER_SENT", userId: ADMIN.id })
    );
  });

  it("ne relance pas une facture déjà réglée (sans valeur, pas d'effet de bord)", async () => {
    invoiceFindUnique.mockResolvedValue({ status: "PAYEE" });

    await sendHostInvoiceReminderAction(reminderForm());

    expect(notifyMock).not.toHaveBeenCalled();
    expect(emailMock).not.toHaveBeenCalled();
    expect(invoiceUpdate).not.toHaveBeenCalled();
  });

  it("ne relance pas une facture introuvable", async () => {
    invoiceFindUnique.mockResolvedValue(null);

    await sendHostInvoiceReminderAction(reminderForm());

    expect(notifyMock).not.toHaveBeenCalled();
  });
});

describe("suspendHostForInvoiceAction", () => {
  it("applique la suspension progressive existante avec le motif HOST_INVOICE_OVERDUE", async () => {
    await suspendHostForInvoiceAction(suspendForm());

    expect(applySuspensionMock).toHaveBeenCalledWith(HOST_ID, "HOST_INVOICE_OVERDUE", {
      invoiceId: INVOICE_ID,
    });
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "HOST_INVOICE_MANUAL_SUSPENSION",
        userId: ADMIN.id,
        metadata: { hostId: HOST_ID, invoiceId: INVOICE_ID },
      })
    );
  });

  it("ne fait rien sur un formulaire invalide (hostId manquant)", async () => {
    const fd = new FormData();
    fd.set("invoiceId", INVOICE_ID);

    await suspendHostForInvoiceAction(fd);

    expect(applySuspensionMock).not.toHaveBeenCalled();
  });
});
