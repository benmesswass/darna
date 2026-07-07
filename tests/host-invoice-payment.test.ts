/**
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP4 — IDOR sur le règlement de la facture
 * hôte. Miroir de tests/booking-idor.test.ts : un hôte ne peut PAS régler ni
 * initier le paiement de la facture d'un autre hôte.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    hostInvoice: { findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => false),
  initKonnectPayment: vi.fn(),
  signKonnectWebhook: vi.fn(() => "sig"),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { erreurInconnue: "Erreur inconnue." },
    factures: {
      factureIndisponible: "Facture indisponible.",
      paiementErreur: "Erreur de paiement.",
    },
  }),
}));

import { payHostInvoiceAction, confirmHostInvoiceAction } from "@/actions/host-invoices";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isKonnectEnabled, initKonnectPayment } from "@/lib/konnect";
import { logAudit } from "@/lib/audit";

const invoiceFindUnique = prisma.hostInvoice.findUnique as unknown as Mock;
const invoiceUpdate = prisma.hostInvoice.update as unknown as Mock;
const invoiceUpdateMany = prisma.hostInvoice.updateMany as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const isKonnectEnabledMock = isKonnectEnabled as unknown as Mock;
const initKonnectMock = initKonnectPayment as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;

const HOST_OWNER = { id: "host-owner", name: "Hôte Test", email: "hote@test.tn", phone: null };
const HOST_ATTACKER = { id: "host-attacker", name: "Attaquant", email: "a@test.tn", phone: null };
const INVOICE_ID = "clinvoice000000000000001";

function idForm(): FormData {
  const fd = new FormData();
  fd.set("invoiceId", INVOICE_ID);
  return fd;
}

function pendingInvoice(hostId: string) {
  return {
    id: INVOICE_ID,
    hostId,
    status: "EN_ATTENTE",
    amount: 40,
    booking: { property: { title: "Villa Hammamet" } },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  invoiceUpdate.mockResolvedValue({});
  invoiceUpdateMany.mockResolvedValue({ count: 1 });
});

describe("payHostInvoiceAction — IDOR", () => {
  it("refuse d'initier le paiement de la facture d'un autre hôte", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    requireUserMock.mockResolvedValue(HOST_ATTACKER);
    invoiceFindUnique.mockResolvedValue(pendingInvoice(HOST_OWNER.id));

    const result = await payHostInvoiceAction(undefined, idForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(initKonnectMock).not.toHaveBeenCalled();
    expect(invoiceUpdate).not.toHaveBeenCalled();
  });

  it("autorise l'hôte titulaire à initier le paiement (contrôle positif)", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    requireUserMock.mockResolvedValue(HOST_OWNER);
    invoiceFindUnique.mockResolvedValue(pendingInvoice(HOST_OWNER.id));
    initKonnectMock.mockResolvedValue({ payUrl: "https://konnect.test/pay", paymentRef: "pay_1" });

    const result = await payHostInvoiceAction(undefined, idForm());

    expect(result).toEqual({ payUrl: "https://konnect.test/pay" });
    expect(initKonnectMock).toHaveBeenCalledWith(
      expect.objectContaining({ amountTND: 40, orderId: INVOICE_ID })
    );
    expect(invoiceUpdate).toHaveBeenCalledWith({
      where: { id: INVOICE_ID },
      data: { paymentRef: "pay_1" },
    });
  });

  it("refuse quand Konnect est désactivé (exclusivité démo/réel)", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(HOST_OWNER);

    const result = await payHostInvoiceAction(undefined, idForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(invoiceFindUnique).not.toHaveBeenCalled();
  });

  it("refuse de repayer une facture déjà réglée", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    requireUserMock.mockResolvedValue(HOST_OWNER);
    invoiceFindUnique.mockResolvedValue({ ...pendingInvoice(HOST_OWNER.id), status: "PAYEE" });

    const result = await payHostInvoiceAction(undefined, idForm());

    expect(result).toEqual({ error: "Facture indisponible." });
    expect(initKonnectMock).not.toHaveBeenCalled();
  });
});

describe("confirmHostInvoiceAction — IDOR + démo (D-analogue AH mock)", () => {
  it("ne règle jamais quand Konnect est actif (anti-confusion démo/réel)", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    await confirmHostInvoiceAction(idForm());
    expect(requireUserMock).not.toHaveBeenCalled();
    expect(invoiceUpdateMany).not.toHaveBeenCalled();
  });

  it("refuse silencieusement de régler la facture d'un autre hôte", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(HOST_ATTACKER);
    invoiceFindUnique.mockResolvedValue(pendingInvoice(HOST_OWNER.id));

    await confirmHostInvoiceAction(idForm());

    expect(invoiceUpdateMany).not.toHaveBeenCalled();
    expect(logAuditMock).not.toHaveBeenCalled();
  });

  it("règle la facture pour l'hôte titulaire (contrôle positif)", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(HOST_OWNER);
    invoiceFindUnique.mockResolvedValue(pendingInvoice(HOST_OWNER.id));

    await confirmHostInvoiceAction(idForm());

    expect(invoiceUpdateMany).toHaveBeenCalledWith({
      where: { id: INVOICE_ID, status: "EN_ATTENTE" },
      data: expect.objectContaining({ status: "PAYEE" }),
    });
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "HOST_INVOICE_PAID", userId: HOST_OWNER.id })
    );
  });

  it("idempotence : ne re-règle pas une facture déjà PAYEE", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(HOST_OWNER);
    invoiceFindUnique.mockResolvedValue({ ...pendingInvoice(HOST_OWNER.id), status: "PAYEE" });

    await confirmHostInvoiceAction(idForm());

    expect(invoiceUpdateMany).not.toHaveBeenCalled();
  });
});
