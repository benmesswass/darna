/**
 * MONETISATION_IMMO_ROADMAP.md §MI3 — gardes des actions d'achat de crédits :
 * réservé aux comptes AGENCE, et exclusivité démo/réel (le mock
 * buyVerificationCreditPackDemoAction ne s'exécute JAMAIS quand Konnect est
 * actif). Miroir de subscription-payment-action.test.ts.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationCreditOrder: { create: vi.fn(), update: vi.fn() },
    verificationWallet: { upsert: vi.fn() },
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
    abonnement: { paiementErreur: "Erreur de paiement." },
  }),
}));

import {
  buyVerificationCreditPackDemoAction,
  startVerificationCreditPaymentAction,
} from "@/actions/verification-credits";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isKonnectEnabled, initKonnectPayment } from "@/lib/konnect";
import { logAudit } from "@/lib/audit";
import { FREE_VERIFICATION_CREDITS } from "@/lib/config";

const orderCreate = prisma.verificationCreditOrder.create as unknown as Mock;
const orderUpdate = prisma.verificationCreditOrder.update as unknown as Mock;
const walletUpsert = prisma.verificationWallet.upsert as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const isKonnectEnabledMock = isKonnectEnabled as unknown as Mock;
const initKonnectMock = initKonnectPayment as unknown as Mock;
const audit = logAudit as unknown as Mock;

const AGENCY = { id: "agency-A", role: "AGENCE", name: "Agence Test", email: "a@test.tn", phone: null };
const HOST = { id: "host-B", role: "HOTE", name: "Hôte Test", email: "h@test.tn", phone: null };

function packForm(pack = "PACK10"): FormData {
  const fd = new FormData();
  fd.set("pack", pack);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  orderCreate.mockResolvedValue({ id: "vco_1" });
  orderUpdate.mockResolvedValue({});
  walletUpsert.mockResolvedValue({});
});

describe("startVerificationCreditPaymentAction", () => {
  it("refuse un compte non-AGENCE (HOTE)", async () => {
    requireUserMock.mockResolvedValue(HOST);
    isKonnectEnabledMock.mockReturnValue(true);
    const res = await startVerificationCreditPaymentAction(undefined, packForm());
    expect(res).toEqual({ error: "Erreur inconnue." });
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("refuse si Konnect est désactivé (mode démo)", async () => {
    requireUserMock.mockResolvedValue(AGENCY);
    isKonnectEnabledMock.mockReturnValue(false);
    const res = await startVerificationCreditPaymentAction(undefined, packForm());
    expect(res).toEqual({ error: "Erreur inconnue." });
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("refuse un lot inconnu", async () => {
    requireUserMock.mockResolvedValue(AGENCY);
    isKonnectEnabledMock.mockReturnValue(true);
    const res = await startVerificationCreditPaymentAction(undefined, packForm("INCONNU"));
    expect(res).toEqual({ error: "Erreur inconnue." });
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("AGENCE + Konnect : crée la commande, initialise le paiement et renvoie payUrl", async () => {
    requireUserMock.mockResolvedValue(AGENCY);
    isKonnectEnabledMock.mockReturnValue(true);
    initKonnectMock.mockResolvedValue({ payUrl: "https://konnect.test/pay", paymentRef: "pay_1" });

    const res = await startVerificationCreditPaymentAction(undefined, packForm("PACK10"));

    expect(res).toEqual({ payUrl: "https://konnect.test/pay" });
    expect(orderCreate).toHaveBeenCalledWith({
      data: { ownerId: "agency-A", credits: 10, amount: 40 },
    });
    expect(initKonnectMock).toHaveBeenCalledWith(
      expect.objectContaining({ amountTND: 40, orderId: "vco_1" })
    );
    expect(orderUpdate).toHaveBeenCalledWith({ where: { id: "vco_1" }, data: { paymentRef: "pay_1" } });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "VERIFICATION_CREDIT_PAYMENT_INITIATED", success: true })
    );
  });
});

describe("buyVerificationCreditPackDemoAction (démo)", () => {
  it("ne s'exécute JAMAIS quand Konnect est actif (exclusivité, pas de crédit gratuit)", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    await buyVerificationCreditPackDemoAction(packForm());
    expect(requireUserMock).not.toHaveBeenCalled();
    expect(walletUpsert).not.toHaveBeenCalled();
  });

  it("mode démo + AGENCE : crédite le lot directement", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(AGENCY);
    await buyVerificationCreditPackDemoAction(packForm("PACK25"));
    expect(walletUpsert).toHaveBeenCalledWith({
      where: { userId: "agency-A" },
      create: { userId: "agency-A", balance: FREE_VERIFICATION_CREDITS + 25 },
      update: { balance: { increment: 25 } },
    });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "VERIFICATION_CREDIT_PURCHASED", success: true })
    );
  });

  it("mode démo + non-AGENCE : no-op", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(HOST);
    await buyVerificationCreditPackDemoAction(packForm());
    expect(walletUpsert).not.toHaveBeenCalled();
  });
});
