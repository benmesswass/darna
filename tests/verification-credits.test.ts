/**
 * MONETISATION_IMMO_ROADMAP.md §MI3 — crédits de vérification Wakil : lecture
 * (absence de VerificationWallet = solde gratuit initial, DÉPENDANT DU RÔLE
 * depuis la décision Wassim du 2026-07-20 : AGENCE a un solde gratuit à vie,
 * HOTE part de 0 et doit payer à l'unité) et consommation atomique (jamais de
 * solde négatif, jamais de double-consommation).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationWallet: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import {
  consumeVerificationCredit,
  freeVerificationCreditsFor,
  isVerificationCreditPackKey,
  verificationCreditPack,
  verificationCreditsRemaining,
} from "@/lib/verification-credits";
import { prisma } from "@/lib/prisma";
import { FREE_VERIFICATION_CREDITS } from "@/lib/config";

const findUnique = prisma.verificationWallet.findUnique as unknown as Mock;
const upsert = prisma.verificationWallet.upsert as unknown as Mock;
const updateMany = prisma.verificationWallet.updateMany as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  upsert.mockResolvedValue({});
});

describe("verificationCreditPack / isVerificationCreditPackKey", () => {
  it("retrouve un lot par sa clé", () => {
    expect(verificationCreditPack("PACK10")?.credits).toBe(10);
    expect(verificationCreditPack("PACK25")?.credits).toBe(25);
  });

  it("renvoie undefined / false pour une clé inconnue", () => {
    expect(verificationCreditPack("INCONNU")).toBeUndefined();
    expect(isVerificationCreditPackKey("INCONNU")).toBe(false);
    expect(isVerificationCreditPackKey("PACK10")).toBe(true);
  });
});

describe("freeVerificationCreditsFor", () => {
  it("AGENCE a un solde gratuit à vie (FREE_VERIFICATION_CREDITS)", () => {
    expect(freeVerificationCreditsFor("AGENCE")).toBe(FREE_VERIFICATION_CREDITS);
  });

  it("HOTE part de 0 — aucune vérification gratuite, paiement à l'unité obligatoire", () => {
    expect(freeVerificationCreditsFor("HOTE")).toBe(0);
  });
});

describe("verificationCreditsRemaining", () => {
  it("AGENCE : renvoie le solde gratuit initial si aucune ligne (jamais consommé)", async () => {
    findUnique.mockResolvedValue(null);
    expect(await verificationCreditsRemaining("u1", "AGENCE")).toBe(FREE_VERIFICATION_CREDITS);
  });

  it("HOTE : renvoie 0 si aucune ligne (jamais payé)", async () => {
    findUnique.mockResolvedValue(null);
    expect(await verificationCreditsRemaining("u2", "HOTE")).toBe(0);
  });

  it("renvoie le solde stocké si une ligne existe, quel que soit le rôle", async () => {
    findUnique.mockResolvedValue({ balance: 7 });
    expect(await verificationCreditsRemaining("u1", "AGENCE")).toBe(7);
    expect(await verificationCreditsRemaining("u2", "HOTE")).toBe(7);
  });

  it("renvoie 0 si le solde stocké est 0 (épuisé, pas de retour au gratuit)", async () => {
    findUnique.mockResolvedValue({ balance: 0 });
    expect(await verificationCreditsRemaining("u1", "AGENCE")).toBe(0);
  });
});

describe("consumeVerificationCredit", () => {
  it("AGENCE : consomme un crédit quand le solde est positif", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    expect(await consumeVerificationCredit("u1", "AGENCE")).toBe(true);
    expect(upsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", balance: FREE_VERIFICATION_CREDITS },
      update: {},
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", balance: { gt: 0 } },
      data: { balance: { decrement: 1 } },
    });
  });

  it("HOTE : la toute première tentative échoue (matérialise la ligne à 0, rien à consommer)", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    expect(await consumeVerificationCredit("u2", "HOTE")).toBe(false);
    expect(upsert).toHaveBeenCalledWith({
      where: { userId: "u2" },
      create: { userId: "u2", balance: 0 },
      update: {},
    });
  });

  it("HOTE : consomme le crédit payé une fois le solde crédité (count>0 côté DB)", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    expect(await consumeVerificationCredit("u2", "HOTE")).toBe(true);
  });

  it("refuse (aucune mutation) quand le solde est à 0", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    expect(await consumeVerificationCredit("u1", "AGENCE")).toBe(false);
  });

  it("matérialise la ligne au solde gratuit AVANT de tenter le prélèvement (1re consommation)", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    await consumeVerificationCredit("nouvelle-agence", "AGENCE");
    // L'upsert doit avoir lieu (no-op si la ligne existe déjà) avant le updateMany conditionné.
    const upsertOrder = upsert.mock.invocationCallOrder[0];
    const updateManyOrder = updateMany.mock.invocationCallOrder[0];
    expect(upsertOrder).toBeLessThan(updateManyOrder);
  });
});
