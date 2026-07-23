/**
 * MONETISATION_IMMO_ROADMAP.md §MI3 — règlement d'un achat de lot de crédits
 * de vérification Wakil. Miroir exact de tests/featured-payments.test.ts
 * (VerificationCreditOrder est une ligne PAR ACHAT, comme FeaturedOrder —
 * idempotence via transition de statut EN_ATTENTE→PAYEE).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationCreditOrder: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    verificationWallet: {
      upsert: vi.fn(),
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

import { settleVerificationCreditOrder } from "@/lib/verification-credit-payments";
import { prisma } from "@/lib/prisma";
import { getKonnectPayment, type KonnectPayment } from "@/lib/konnect";
import { logAudit } from "@/lib/audit";
import { FREE_VERIFICATION_CREDITS } from "@/lib/config";

const findFirst = prisma.verificationCreditOrder.findFirst as unknown as Mock;
const updateMany = prisma.verificationCreditOrder.updateMany as unknown as Mock;
const walletUpsert = prisma.verificationWallet.upsert as unknown as Mock;
const getPayment = getKonnectPayment as unknown as Mock;
const audit = logAudit as unknown as Mock;

type OrderRow = {
  id: string;
  ownerId: string;
  credits: number;
  amount: number;
  status: string;
  paymentRef: string | null;
};

function row(over: Partial<OrderRow> = {}): OrderRow {
  return {
    id: "vco_1",
    ownerId: "agence_1",
    credits: 10,
    amount: 40,
    status: "EN_ATTENTE",
    paymentRef: "pay_1",
    ...over,
  };
}

function payment(over: Partial<KonnectPayment> = {}): KonnectPayment {
  return {
    id: "pay_1",
    status: "completed",
    amount: 40_000,
    reachedAmount: 40_000, // = 40 TND attendus (PACK10)
    token: "TND",
    ...over,
  };
}

describe("settleVerificationCreditOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMany.mockResolvedValue({ count: 1 });
    walletUpsert.mockResolvedValue({});
  });

  it("retourne INTROUVABLE pour une référence inconnue (inoffensif)", async () => {
    findFirst.mockResolvedValue(null);
    expect(await settleVerificationCreditOrder({ paymentRef: "nope" })).toBe("INTROUVABLE");
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("est idempotent : une commande déjà PAYEE ne re-vérifie rien ni ne recrédite", async () => {
    findFirst.mockResolvedValue(row({ status: "PAYEE" }));
    expect(await settleVerificationCreditOrder({ orderId: "vco_1" })).toBe("PAYEE");
    expect(getPayment).not.toHaveBeenCalled();
    expect(walletUpsert).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("retourne EN_ATTENTE si le paiement n'a jamais été initié (paymentRef null)", async () => {
    findFirst.mockResolvedValue(row({ paymentRef: null }));
    expect(await settleVerificationCreditOrder({ orderId: "vco_1" })).toBe("EN_ATTENTE");
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("ne règle pas tant que Konnect n'a pas abouti (pending)", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment({ status: "pending" }));
    expect(await settleVerificationCreditOrder({ paymentRef: "pay_1" })).toBe("EN_ATTENTE");
    expect(updateMany).not.toHaveBeenCalled();
    expect(walletUpsert).not.toHaveBeenCalled();
  });

  it("REFUSE de créditer si le montant reçu est inférieur au prix du lot", async () => {
    findFirst.mockResolvedValue(row({ amount: 40 }));
    getPayment.mockResolvedValue(payment({ reachedAmount: 20_000 })); // < 40 000
    expect(await settleVerificationCreditOrder({ paymentRef: "pay_1" })).toBe("ERREUR");
    expect(updateMany).not.toHaveBeenCalled();
    expect(walletUpsert).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("règle une commande dont le paiement est abouti et complet, et crédite le solde", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment());

    expect(await settleVerificationCreditOrder({ paymentRef: "pay_1" })).toBe("PAYEE");
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "vco_1", status: "EN_ATTENTE" },
        data: expect.objectContaining({ status: "PAYEE" }),
      })
    );
    expect(walletUpsert).toHaveBeenCalledWith({
      where: { userId: "agence_1" },
      create: { userId: "agence_1", balance: FREE_VERIFICATION_CREDITS + 10 },
      update: { balance: { increment: 10 } },
    });
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "VERIFICATION_CREDIT_PURCHASED",
        userId: "agence_1",
        success: true,
      })
    );
  });

  it("gère la course webhook/retour : si une autre requête a déjà réglé, pas de double crédit", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment());
    updateMany.mockResolvedValue({ count: 0 }); // déjà réglée par la requête concurrente

    expect(await settleVerificationCreditOrder({ paymentRef: "pay_1" })).toBe("PAYEE");
    expect(walletUpsert).not.toHaveBeenCalled(); // pas de double crédit
    expect(audit).not.toHaveBeenCalled();
  });
});
