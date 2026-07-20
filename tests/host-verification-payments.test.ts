/**
 * MONETISATION_IMMO_ROADMAP.md §MI3 (décision Wassim du 2026-07-20) — paiement
 * de la vérification Wakil pour un HOTE : gardes des actions (réservé aux
 * comptes HOTE, jamais AGENCE — l'agence a son propre système de lots) et
 * exclusivité démo/réel (le mock ne s'exécute jamais quand Konnect est actif).
 * Miroir de tests/verification-credit-payment-action.test.ts.
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
  payHostVerificationDemoAction,
  startHostVerificationPaymentAction,
} from "@/actions/host-verification-payments";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isKonnectEnabled, initKonnectPayment } from "@/lib/konnect";
import { logAudit } from "@/lib/audit";
import { HOST_VERIFICATION_PRICE_TND } from "@/lib/config";

const orderCreate = prisma.verificationCreditOrder.create as unknown as Mock;
const orderUpdate = prisma.verificationCreditOrder.update as unknown as Mock;
const walletUpsert = prisma.verificationWallet.upsert as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const isKonnectEnabledMock = isKonnectEnabled as unknown as Mock;
const initKonnectMock = initKonnectPayment as unknown as Mock;
const audit = logAudit as unknown as Mock;

const HOST = { id: "host-A", role: "HOTE", name: "Hôte Test", email: "h@test.tn", phone: null };
const AGENCY = { id: "agency-B", role: "AGENCE", name: "Agence Test", email: "a@test.tn", phone: null };

beforeEach(() => {
  vi.clearAllMocks();
  orderCreate.mockResolvedValue({ id: "vco_1" });
  orderUpdate.mockResolvedValue({});
  walletUpsert.mockResolvedValue({});
});

describe("startHostVerificationPaymentAction", () => {
  it("refuse un compte AGENCE (régime réservé aux particuliers)", async () => {
    requireUserMock.mockResolvedValue(AGENCY);
    isKonnectEnabledMock.mockReturnValue(true);
    const res = await startHostVerificationPaymentAction(undefined);
    expect(res).toEqual({ error: "Erreur inconnue." });
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("refuse si Konnect est désactivé (mode démo)", async () => {
    requireUserMock.mockResolvedValue(HOST);
    isKonnectEnabledMock.mockReturnValue(false);
    const res = await startHostVerificationPaymentAction(undefined);
    expect(res).toEqual({ error: "Erreur inconnue." });
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("HOTE + Konnect : crée une commande d'exactement 1 crédit au prix unitaire, renvoie payUrl", async () => {
    requireUserMock.mockResolvedValue(HOST);
    isKonnectEnabledMock.mockReturnValue(true);
    initKonnectMock.mockResolvedValue({ payUrl: "https://konnect.test/pay", paymentRef: "pay_1" });

    const res = await startHostVerificationPaymentAction(undefined);

    expect(res).toEqual({ payUrl: "https://konnect.test/pay" });
    expect(orderCreate).toHaveBeenCalledWith({
      data: { ownerId: "host-A", credits: 1, amount: HOST_VERIFICATION_PRICE_TND },
    });
    expect(initKonnectMock).toHaveBeenCalledWith(
      expect.objectContaining({ amountTND: HOST_VERIFICATION_PRICE_TND, orderId: "vco_1" })
    );
    expect(orderUpdate).toHaveBeenCalledWith({ where: { id: "vco_1" }, data: { paymentRef: "pay_1" } });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "VERIFICATION_CREDIT_PAYMENT_INITIATED", success: true })
    );
  });
});

describe("payHostVerificationDemoAction (démo)", () => {
  it("ne s'exécute JAMAIS quand Konnect est actif (exclusivité, pas de crédit gratuit)", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    await payHostVerificationDemoAction();
    expect(requireUserMock).not.toHaveBeenCalled();
    expect(walletUpsert).not.toHaveBeenCalled();
  });

  it("mode démo + HOTE : crédite exactement 1 vérification", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(HOST);
    await payHostVerificationDemoAction();
    expect(walletUpsert).toHaveBeenCalledWith({
      where: { userId: "host-A" },
      create: { userId: "host-A", balance: 1 },
      update: { balance: { increment: 1 } },
    });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "VERIFICATION_CREDIT_PURCHASED", success: true })
    );
  });

  it("mode démo + AGENCE : no-op (l'agence utilise son propre système de lots)", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(AGENCY);
    await payHostVerificationDemoAction();
    expect(walletUpsert).not.toHaveBeenCalled();
  });
});
