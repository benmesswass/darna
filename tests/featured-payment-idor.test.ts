/**
 * MONETISATION_IMMO_ROADMAP.md §MI0 — IDOR sur l'initiation du paiement de
 * mise en avant, et garde d'exclusivité démo/réel. Miroir de
 * tests/host-invoice-payment.test.ts : un hôte ne peut PAS booster l'annonce
 * d'un autre, et le mock (featureListingAction) ne s'exécute jamais quand
 * Konnect est actif.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn(), update: vi.fn() },
    featuredOrder: { create: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn(), requireLister: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => false),
  initKonnectPayment: vi.fn(),
  signKonnectWebhook: vi.fn(() => "sig"),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { erreurInconnue: "Erreur inconnue." },
    alaUne: {
      indisponible: "Annonce indisponible.",
      paiementErreur: "Erreur de paiement.",
    },
  }),
}));

import {
  startFeaturedOrderPaymentAction,
  featureListingAction,
} from "@/actions/properties";
import { prisma } from "@/lib/prisma";
import { requireLister } from "@/lib/session";
import { isKonnectEnabled, initKonnectPayment } from "@/lib/konnect";
import { logAudit } from "@/lib/audit";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const propertyUpdate = prisma.property.update as unknown as Mock;
const orderCreate = prisma.featuredOrder.create as unknown as Mock;
const orderUpdate = prisma.featuredOrder.update as unknown as Mock;
const requireListerMock = requireLister as unknown as Mock;
const isKonnectEnabledMock = isKonnectEnabled as unknown as Mock;
const initKonnectMock = initKonnectPayment as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;

const OWNER = { id: "owner-A", name: "Hôte Test", email: "hote@test.tn", phone: null };
const ATTACKER = { id: "attacker-B", name: "Attaquant", email: "a@test.tn", phone: null };
const PROP_ID = "clproperty000000000000001";

function idForm(): FormData {
  const fd = new FormData();
  fd.set("propertyId", PROP_ID);
  return fd;
}

function activeProperty(ownerId: string) {
  return {
    id: PROP_ID,
    ownerId,
    title: "Villa Hammamet",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  orderCreate.mockResolvedValue({ id: "order_1" });
  orderUpdate.mockResolvedValue({});
  propertyUpdate.mockResolvedValue({});
});

describe("startFeaturedOrderPaymentAction — IDOR", () => {
  it("refuse de booster l'annonce d'un autre hôte", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    requireListerMock.mockResolvedValue(ATTACKER);
    propertyFindUnique.mockResolvedValue(activeProperty(OWNER.id));

    const result = await startFeaturedOrderPaymentAction(undefined, idForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(orderCreate).not.toHaveBeenCalled();
    expect(initKonnectMock).not.toHaveBeenCalled();
  });

  it("autorise le propriétaire à booster sa propre annonce (contrôle positif)", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    requireListerMock.mockResolvedValue(OWNER);
    propertyFindUnique.mockResolvedValue(activeProperty(OWNER.id));
    initKonnectMock.mockResolvedValue({ payUrl: "https://konnect.test/pay", paymentRef: "pay_1" });

    const result = await startFeaturedOrderPaymentAction(undefined, idForm());

    expect(result).toEqual({ payUrl: "https://konnect.test/pay" });
    expect(orderCreate).toHaveBeenCalledWith({
      data: { propertyId: PROP_ID, ownerId: OWNER.id, amount: 49 },
    });
    expect(initKonnectMock).toHaveBeenCalledWith(
      expect.objectContaining({ amountTND: 49, orderId: "order_1" })
    );
    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: "order_1" },
      data: { paymentRef: "pay_1" },
    });
  });

  it("refuse quand Konnect est désactivé (exclusivité démo/réel)", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireListerMock.mockResolvedValue(OWNER);

    const result = await startFeaturedOrderPaymentAction(undefined, idForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(propertyFindUnique).not.toHaveBeenCalled();
  });

  it("refuse de booster une annonce non active / expirée", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    requireListerMock.mockResolvedValue(OWNER);
    propertyFindUnique.mockResolvedValue({
      ...activeProperty(OWNER.id),
      status: "EXPIREE",
    });

    const result = await startFeaturedOrderPaymentAction(undefined, idForm());

    expect(result).toEqual({ error: "Annonce indisponible." });
    expect(orderCreate).not.toHaveBeenCalled();
  });
});

describe("featureListingAction (démo) — garde d'exclusivité", () => {
  it("ne fait rien quand Konnect est actif (anti-confusion démo/réel)", async () => {
    isKonnectEnabledMock.mockReturnValue(true);

    await featureListingAction(idForm());

    expect(requireListerMock).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
    expect(logAuditMock).not.toHaveBeenCalled();
  });
});
