/**
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP4 — règlement de la facture hôte.
 * Miroir exact de tests/payments.test.ts (settleKonnectBooking), appliqué à
 * settleHostInvoice : idempotence, contrôle du montant, course webhook/retour.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    hostInvoice: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));
vi.mock("@/lib/konnect", () => ({
  getKonnectPayment: vi.fn(),
  tndToMillimes: (tnd: number) => Math.round(tnd * 1000),
}));
vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
  logStructured: vi.fn(),
}));

import { hasOverdueHostInvoice, settleHostInvoice } from "@/lib/host-invoicing";
import { prisma } from "@/lib/prisma";
import { getKonnectPayment, type KonnectPayment } from "@/lib/konnect";
import { logAudit } from "@/lib/audit";

const findFirst = prisma.hostInvoice.findFirst as unknown as Mock;
const updateMany = prisma.hostInvoice.updateMany as unknown as Mock;
const count = prisma.hostInvoice.count as unknown as Mock;
const getPayment = getKonnectPayment as unknown as Mock;
const audit = logAudit as unknown as Mock;

type InvoiceRow = {
  id: string;
  hostId: string;
  status: string;
  amount: number;
  paymentRef: string | null;
};

function row(over: Partial<InvoiceRow> = {}): InvoiceRow {
  return {
    id: "inv_1",
    hostId: "host_1",
    status: "EN_ATTENTE",
    amount: 40,
    paymentRef: "pay_1",
    ...over,
  };
}

function payment(over: Partial<KonnectPayment> = {}): KonnectPayment {
  return {
    id: "pay_1",
    status: "completed",
    amount: 40_000,
    reachedAmount: 40_000, // = 40 TND attendus
    token: "TND",
    ...over,
  };
}

describe("settleHostInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("retourne INTROUVABLE pour une référence inconnue (inoffensif)", async () => {
    findFirst.mockResolvedValue(null);
    expect(await settleHostInvoice({ paymentRef: "nope" })).toBe("INTROUVABLE");
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("est idempotent : une facture déjà PAYEE ne re-vérifie rien", async () => {
    findFirst.mockResolvedValue(row({ status: "PAYEE" }));
    expect(await settleHostInvoice({ invoiceId: "inv_1" })).toBe("PAYEE");
    expect(getPayment).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("retourne EN_ATTENTE si le paiement n'a jamais été initié (paymentRef null)", async () => {
    findFirst.mockResolvedValue(row({ paymentRef: null }));
    expect(await settleHostInvoice({ invoiceId: "inv_1" })).toBe("EN_ATTENTE");
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("ne règle pas tant que Konnect n'a pas abouti (pending)", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment({ status: "pending" }));
    expect(await settleHostInvoice({ paymentRef: "pay_1" })).toBe("EN_ATTENTE");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("REFUSE de régler si le montant reçu est inférieur au dû", async () => {
    findFirst.mockResolvedValue(row({ amount: 40 }));
    getPayment.mockResolvedValue(payment({ reachedAmount: 30_000 })); // < 40 000
    expect(await settleHostInvoice({ paymentRef: "pay_1" })).toBe("ERREUR");
    expect(updateMany).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("règle une facture dont le paiement est abouti et complet", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment());
    updateMany.mockResolvedValue({ count: 1 });

    expect(await settleHostInvoice({ paymentRef: "pay_1" })).toBe("PAYEE");
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "inv_1", status: "EN_ATTENTE" },
        data: expect.objectContaining({ status: "PAYEE" }),
      })
    );
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "HOST_INVOICE_PAID", userId: "host_1", success: true })
    );
  });

  it("gère la course webhook/retour : si une autre requête a déjà réglé, pas de double effet", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment());
    updateMany.mockResolvedValue({ count: 0 }); // déjà réglée par la requête concurrente

    expect(await settleHostInvoice({ paymentRef: "pay_1" })).toBe("PAYEE");
    expect(audit).not.toHaveBeenCalled(); // pas de re-log ni d'effet de bord
  });
});

describe("hasOverdueHostInvoice (§PSP6 — levier de recouvrement)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("détecte une facture EN_ATTENTE dont l'échéance est dépassée", async () => {
    count.mockResolvedValue(1);
    expect(await hasOverdueHostInvoice("host_1")).toBe(true);
    expect(count).toHaveBeenCalledWith({
      where: { hostId: "host_1", status: "EN_ATTENTE", dueAt: { lt: expect.any(Date) } },
    });
  });

  it("redevient faux IMMÉDIATEMENT dès que la facture n'est plus en retard (réglée) — aucun champ à resynchroniser", async () => {
    count.mockResolvedValueOnce(1);
    expect(await hasOverdueHostInvoice("host_1")).toBe(true);

    // Le règlement (settleHostInvoice) fait passer le statut à PAYEE : le
    // COUNT filtré sur EN_ATTENTE ne la trouve plus, sans rien d'autre à
    // mettre à jour (pas de champ dénormalisé sur Property/HostInvoice).
    count.mockResolvedValueOnce(0);
    expect(await hasOverdueHostInvoice("host_1")).toBe(false);
  });

  it("retourne faux quand aucune facture n'est en retard", async () => {
    count.mockResolvedValue(0);
    expect(await hasOverdueHostInvoice("host_1")).toBe(false);
  });
});
