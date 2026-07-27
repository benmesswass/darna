/**
 * LANCEMENT_ROADMAP.md §L3.4 / PAIEMENT_SUR_PLACE_ROADMAP.md §PSP5 — le job ne
 * fait que trouver la liste des hôtes à couvrir et déléguer ENTIÈREMENT à
 * ensureHostInvoiceReminders (déjà testée par ailleurs, tests/host-invoice-
 * reminders.test.ts) : notification + e-mail + dédoublonnage n'ont pas à être
 * re-testés ici.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { hostInvoice: { findMany: vi.fn() } },
}));
vi.mock("@/lib/observability", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/notification-center", () => ({ ensureHostInvoiceReminders: vi.fn() }));

import { remindHostInvoices } from "@/lib/jobs/host-invoice-reminder";
import { prisma } from "@/lib/prisma";
import { captureError } from "@/lib/observability";
import { ensureHostInvoiceReminders } from "@/lib/notification-center";

const findMany = prisma.hostInvoice.findMany as unknown as Mock;
const ensureMock = ensureHostInvoiceReminders as unknown as Mock;
const captureErrorMock = captureError as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  ensureMock.mockResolvedValue(undefined);
});

describe("remindHostInvoices", () => {
  it("appelle ensureHostInvoiceReminders pour chaque hôte concerné", async () => {
    findMany.mockResolvedValue([{ hostId: "host-1" }, { hostId: "host-2" }]);

    const summary = await remindHostInvoices();

    expect(ensureMock).toHaveBeenCalledWith("host-1");
    expect(ensureMock).toHaveBeenCalledWith("host-2");
    expect(ensureMock).toHaveBeenCalledTimes(2);
    expect(summary).toEqual({ hostsChecked: 2 });
  });

  it("interroge les HostInvoice EN_ATTENTE avec dueAt proche, distinct par hôte", async () => {
    findMany.mockResolvedValue([]);

    await remindHostInvoices();

    const call = findMany.mock.calls[0][0];
    expect(call.where.status).toBe("EN_ATTENTE");
    expect(call.where.dueAt.lte).toBeInstanceOf(Date);
    expect(call.distinct).toEqual(["hostId"]);
  });

  it("isole un hôte en échec : les autres sont quand même couverts", async () => {
    findMany.mockResolvedValue([{ hostId: "host-1" }, { hostId: "host-2" }]);
    ensureMock.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(undefined);

    const summary = await remindHostInvoices();

    expect(captureErrorMock).toHaveBeenCalledTimes(1);
    expect(captureErrorMock).toHaveBeenCalledWith(expect.any(Error), {
      entity: "HostInvoice",
      hostId: "host-1",
      phase: "invoice_reminder",
    });
    expect(ensureMock).toHaveBeenCalledTimes(2);
    expect(summary).toEqual({ hostsChecked: 2 });
  });

  it("aucun hôte concerné → aucun appel, résumé à zéro", async () => {
    findMany.mockResolvedValue([]);

    const summary = await remindHostInvoices();

    expect(ensureMock).not.toHaveBeenCalled();
    expect(summary).toEqual({ hostsChecked: 0 });
  });
});
