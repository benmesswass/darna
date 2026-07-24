/**
 * CROISSANCE_ROADMAP.md §CR0 — fondations du programme de crédits : lecture
 * (absence de CreditWallet = solde 0), émission/dépense atomiques (jamais de
 * solde négatif, jamais de mutation sur dépense refusée) et code de
 * parrainage (généré paresseusement, jamais régénéré). Logique pure, prisma
 * mocké — même structure que verification-credits.test.ts (MI3).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    creditWallet: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    creditTransaction: { create: vi.fn() },
    user: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import {
  creditBalance,
  ensureReferralCode,
  findUserByReferralCode,
  issueCredit,
  spendCredit,
} from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { CREDIT_VALIDITY_DAYS } from "@/lib/config";

const walletFindUnique = prisma.creditWallet.findUnique as unknown as Mock;
const walletFindUniqueOrThrow = prisma.creditWallet.findUniqueOrThrow as unknown as Mock;
const walletUpsert = prisma.creditWallet.upsert as unknown as Mock;
const walletUpdateMany = prisma.creditWallet.updateMany as unknown as Mock;
const transactionCreate = prisma.creditTransaction.create as unknown as Mock;
const userFindUnique = prisma.user.findUnique as unknown as Mock;
const userFindUniqueOrThrow = prisma.user.findUniqueOrThrow as unknown as Mock;
const userUpdate = prisma.user.update as unknown as Mock;

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  vi.clearAllMocks();
  walletUpsert.mockResolvedValue({ id: "wallet-1" });
  transactionCreate.mockResolvedValue({});
});

describe("creditBalance", () => {
  it("renvoie 0 si aucune ligne (jamais crédité)", async () => {
    walletFindUnique.mockResolvedValue(null);
    expect(await creditBalance("u1")).toBe(0);
  });

  it("renvoie le solde stocké si une ligne existe", async () => {
    walletFindUnique.mockResolvedValue({ balance: 25 });
    expect(await creditBalance("u1")).toBe(25);
  });
});

describe("issueCredit", () => {
  it("rejette un montant non positif sans toucher la base", async () => {
    await expect(issueCredit({ userId: "u1", amount: 0, motif: "AJUSTEMENT_ADMIN" })).rejects.toThrow();
    await expect(issueCredit({ userId: "u1", amount: -5, motif: "AJUSTEMENT_ADMIN" })).rejects.toThrow();
    expect(walletUpsert).not.toHaveBeenCalled();
  });

  it("matérialise le wallet (create à `amount` / increment) puis journalise le mouvement", async () => {
    await issueCredit({ userId: "u1", amount: 15, motif: "BIENVENUE_PARRAINAGE" });

    expect(walletUpsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", balance: 15 },
      update: { balance: { increment: 15 } },
    });
    expect(transactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        walletId: "wallet-1",
        amount: 15,
        motif: "BIENVENUE_PARRAINAGE",
        bookingId: undefined,
        referredUserId: undefined,
      }),
    });
  });

  it("pose expiresAt à ~CREDIT_VALIDITY_DAYS jours (émission uniquement)", async () => {
    const before = Date.now();
    await issueCredit({ userId: "u1", amount: 10, motif: "BIENVENUE_SPONTANE" });
    const expiresAt = transactionCreate.mock.calls[0][0].data.expiresAt as Date;

    const expectedMin = before + CREDIT_VALIDITY_DAYS * DAY_MS - 5000;
    const expectedMax = Date.now() + CREDIT_VALIDITY_DAYS * DAY_MS + 5000;
    expect(expiresAt.getTime()).toBeGreaterThan(expectedMin);
    expect(expiresAt.getTime()).toBeLessThan(expectedMax);
  });

  it("transmet bookingId/referredUserId au mouvement quand fournis", async () => {
    await issueCredit({
      userId: "u1",
      amount: 40,
      motif: "PARRAINAGE_FILLEUL_TERMINE",
      referredUserId: "filleul-1",
    });

    expect(transactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ referredUserId: "filleul-1" }),
    });
  });

  it("upsert le wallet AVANT de journaliser le mouvement (walletId dépend de l'upsert)", async () => {
    await issueCredit({ userId: "u1", amount: 10, motif: "AJUSTEMENT_ADMIN" });

    const upsertOrder = walletUpsert.mock.invocationCallOrder[0];
    const createOrder = transactionCreate.mock.invocationCallOrder[0];
    expect(upsertOrder).toBeLessThan(createOrder);
  });
});

describe("spendCredit", () => {
  it("rejette un montant non positif sans toucher la base", async () => {
    await expect(spendCredit({ userId: "u1", amount: 0, motif: "UTILISATION_RESERVATION" })).rejects.toThrow();
    expect(walletUpsert).not.toHaveBeenCalled();
  });

  it("refuse (aucune mutation) quand le solde est insuffisant", async () => {
    walletUpdateMany.mockResolvedValue({ count: 0 });
    expect(await spendCredit({ userId: "u1", amount: 50, motif: "UTILISATION_RESERVATION" })).toBe(false);
    expect(walletUpsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", balance: 0 },
      update: {},
    });
    expect(transactionCreate).not.toHaveBeenCalled();
  });

  it("dépense atomiquement (updateMany gardé par balance >= amount) et journalise un montant négatif", async () => {
    walletUpdateMany.mockResolvedValue({ count: 1 });
    walletFindUniqueOrThrow.mockResolvedValue({ id: "wallet-1" });

    expect(await spendCredit({ userId: "u1", amount: 20, motif: "UTILISATION_SERVICE_HOTE", bookingId: "b1" })).toBe(
      true
    );
    expect(walletUpdateMany).toHaveBeenCalledWith({
      where: { userId: "u1", balance: { gte: 20 } },
      data: { balance: { decrement: 20 } },
    });
    expect(transactionCreate).toHaveBeenCalledWith({
      data: { walletId: "wallet-1", amount: -20, motif: "UTILISATION_SERVICE_HOTE", bookingId: "b1" },
    });
  });

  it("matérialise le wallet à 0 AVANT le prélèvement gardé (1re dépense)", async () => {
    walletUpdateMany.mockResolvedValue({ count: 0 });
    await spendCredit({ userId: "nouveau", amount: 10, motif: "UTILISATION_RESERVATION" });

    const upsertOrder = walletUpsert.mock.invocationCallOrder[0];
    const updateManyOrder = walletUpdateMany.mock.invocationCallOrder[0];
    expect(upsertOrder).toBeLessThan(updateManyOrder);
  });
});

describe("ensureReferralCode", () => {
  it("renvoie le code existant sans le régénérer", async () => {
    userFindUniqueOrThrow.mockResolvedValue({ referralCode: "AB12CD34" });
    expect(await ensureReferralCode("u1")).toBe("AB12CD34");
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("génère et persiste un nouveau code hex majuscule s'il n'existe pas encore", async () => {
    userFindUniqueOrThrow.mockResolvedValue({ referralCode: null });
    userUpdate.mockImplementation(({ data }) => Promise.resolve({ referralCode: data.referralCode }));

    const code = await ensureReferralCode("u1");

    expect(code).toMatch(/^[0-9A-F]{8}$/);
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { referralCode: code },
      select: { referralCode: true },
    });
  });
});

describe("findUserByReferralCode", () => {
  it("renvoie le propriétaire du code", async () => {
    userFindUnique.mockResolvedValue({ id: "parrain-1" });
    expect(await findUserByReferralCode("AB12CD34")).toEqual({ id: "parrain-1" });
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { referralCode: "AB12CD34" },
      select: { id: true },
    });
  });

  it("renvoie null pour un code inconnu", async () => {
    userFindUnique.mockResolvedValue(null);
    expect(await findUserByReferralCode("INCONNU")).toBeNull();
  });
});
