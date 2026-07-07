/**
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP5 — détection paresseuse des HostInvoice
 * bientôt dues / en retard. Même idiome que ensureExpiringSoonNotifications :
 * pas de cron, dédupliqué par contrainte unique partielle (P2002 = déjà
 * notifié à ce palier, silencieux), e-mail envoyé UNIQUEMENT quand une notif
 * a réellement été créée (jamais de doublon).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    hostInvoice: { findMany: vi.fn() },
    notification: { create: vi.fn() },
  },
}));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));
vi.mock("@/lib/notifications", () => ({
  sendHostInvoiceDueSoonEmail: vi.fn(),
  sendHostInvoiceOverdueEmail: vi.fn(),
}));

import { ensureHostInvoiceReminders } from "@/lib/notification-center";
import { prisma } from "@/lib/prisma";
import { sendHostInvoiceDueSoonEmail, sendHostInvoiceOverdueEmail } from "@/lib/notifications";

const findMany = prisma.hostInvoice.findMany as unknown as Mock;
const notifCreate = prisma.notification.create as unknown as Mock;
const dueSoonEmail = sendHostInvoiceDueSoonEmail as unknown as Mock;
const overdueEmail = sendHostInvoiceOverdueEmail as unknown as Mock;

const DAY = 24 * 60 * 60 * 1000;
const USER_ID = "host-1";

function invoiceRow(id: string, daysFromNow: number) {
  return {
    id,
    dueAt: new Date(Date.now() + daysFromNow * DAY),
    booking: { property: { title: "Villa Hammamet" } },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  notifCreate.mockResolvedValue({});
});

describe("ensureHostInvoiceReminders", () => {
  it("crée une notif FACTURE_BIENTOT_DUE + e-mail pour une échéance proche (< 3 jours)", async () => {
    findMany.mockResolvedValue([invoiceRow("inv-1", 2)]);

    await ensureHostInvoiceReminders(USER_ID);

    expect(notifCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: USER_ID,
        type: "FACTURE_BIENTOT_DUE",
        href: "/dashboard/factures/inv-1",
      }),
    });
    expect(dueSoonEmail).toHaveBeenCalledWith("inv-1");
    expect(overdueEmail).not.toHaveBeenCalled();
  });

  it("crée une notif FACTURE_EN_RETARD + e-mail pour une échéance dépassée", async () => {
    findMany.mockResolvedValue([invoiceRow("inv-2", -1)]);

    await ensureHostInvoiceReminders(USER_ID);

    expect(notifCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: "FACTURE_EN_RETARD", href: "/dashboard/factures/inv-2" }),
    });
    expect(overdueEmail).toHaveBeenCalledWith("inv-2");
    expect(dueSoonEmail).not.toHaveBeenCalled();
  });

  it("dédup silencieuse (P2002) : pas d'e-mail si déjà notifié à ce palier", async () => {
    findMany.mockResolvedValue([invoiceRow("inv-3", 1)]);
    notifCreate.mockRejectedValue({ code: "P2002" });

    await ensureHostInvoiceReminders(USER_ID);

    expect(dueSoonEmail).not.toHaveBeenCalled();
    expect(overdueEmail).not.toHaveBeenCalled();
  });

  it("ne fait rien pour une facture dont l'échéance est encore lointaine", async () => {
    findMany.mockResolvedValue([]);

    await ensureHostInvoiceReminders(USER_ID);

    expect(notifCreate).not.toHaveBeenCalled();
  });
});
