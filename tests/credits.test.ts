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
      update: vi.fn(),
    },
    creditTransaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    property: { findFirst: vi.fn() },
    booking: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/bookings", () => ({ completeElapsedBookings: vi.fn() }));

import {
  computeCreditApplication,
  creditBalance,
  ensureReferralCode,
  findUserByReferralCode,
  grantWelcomeCreditIfEligible,
  issueCredit,
  refundCreditForBooking,
  settleHostReferralMilestones,
  spendCredit,
} from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { CREDIT_VALIDITY_DAYS, HOST_REFERRAL_BONUS_TND, HOST_REFERRAL_YEARLY_CAP } from "@/lib/config";

const walletFindUnique = prisma.creditWallet.findUnique as unknown as Mock;
const walletFindUniqueOrThrow = prisma.creditWallet.findUniqueOrThrow as unknown as Mock;
const walletUpsert = prisma.creditWallet.upsert as unknown as Mock;
const walletUpdateMany = prisma.creditWallet.updateMany as unknown as Mock;
const walletUpdate = prisma.creditWallet.update as unknown as Mock;
const transactionCreate = prisma.creditTransaction.create as unknown as Mock;
const transactionFindMany = prisma.creditTransaction.findMany as unknown as Mock;
const transactionFindFirst = prisma.creditTransaction.findFirst as unknown as Mock;
const transactionUpdate = prisma.creditTransaction.update as unknown as Mock;
const transactionUpdateMany = prisma.creditTransaction.updateMany as unknown as Mock;
const transactionCount = prisma.creditTransaction.count as unknown as Mock;
const userFindUnique = prisma.user.findUnique as unknown as Mock;
const userFindUniqueOrThrow = prisma.user.findUniqueOrThrow as unknown as Mock;
const userUpdate = prisma.user.update as unknown as Mock;
const userFindMany = prisma.user.findMany as unknown as Mock;
const propertyFindFirst = prisma.property.findFirst as unknown as Mock;
const bookingFindFirst = prisma.booking.findFirst as unknown as Mock;

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  vi.clearAllMocks();
  // Par défaut : aucune émission à balayer/consommer (sweepExpiredCredits et
  // la boucle FIFO de spendCredit no-opent) — les tests CR0/CR1 existants ne
  // s'en préoccupent pas ; les tests CR4 ci-dessous surchargent explicitement.
  transactionFindMany.mockResolvedValue([]);
  walletUpsert.mockResolvedValue({ id: "wallet-1" });
  transactionCreate.mockResolvedValue({});
  // §CR2 : par défaut, aucun filleul/jalon — les tests CR0/CR1/CR4 existants
  // n'appellent pas settleHostReferralMilestones, ces defaults ne les affectent pas.
  transactionCount.mockResolvedValue(0);
  userFindMany.mockResolvedValue([]);
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

describe("creditBalance — purge des émissions expirées (§CR4)", () => {
  it("balaie une émission expirée : décrémente le wallet et journalise EXPIRATION", async () => {
    walletFindUnique.mockResolvedValue({ id: "wallet-1", balance: 15 });
    transactionFindMany.mockResolvedValue([{ id: "tx-1", remainingAmount: 15 }]);
    transactionUpdateMany.mockResolvedValue({ count: 1 });

    await creditBalance("u1");

    expect(transactionUpdateMany).toHaveBeenCalledWith({
      where: { id: "tx-1", remainingAmount: 15 },
      data: { remainingAmount: 0 },
    });
    expect(walletUpdate).toHaveBeenCalledWith({
      where: { id: "wallet-1" },
      data: { balance: { decrement: 15 } },
    });
    expect(transactionCreate).toHaveBeenCalledWith({
      data: { walletId: "wallet-1", amount: -15, motif: "EXPIRATION" },
    });
  });

  it("ignore une émission déjà balayée par un appel concurrent (updateMany count=0)", async () => {
    walletFindUnique.mockResolvedValue({ id: "wallet-1", balance: 0 });
    transactionFindMany.mockResolvedValue([{ id: "tx-1", remainingAmount: 15 }]);
    transactionUpdateMany.mockResolvedValue({ count: 0 });

    await creditBalance("u1");

    expect(walletUpdate).not.toHaveBeenCalled();
    expect(transactionCreate).not.toHaveBeenCalled();
  });

  it("n'appelle rien si aucun wallet n'existe (rien à balayer)", async () => {
    walletFindUnique.mockResolvedValue(null);
    await creditBalance("u1");
    expect(transactionFindMany).not.toHaveBeenCalled();
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

  it("pose remainingAmount = amount à l'émission (§CR4 — base de la purge/consommation FIFO)", async () => {
    await issueCredit({ userId: "u1", amount: 40, motif: "BIENVENUE_PARRAINAGE" });
    expect(transactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ remainingAmount: 40 }),
    });
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

describe("spendCredit — consommation FIFO + purge (§CR4)", () => {
  beforeEach(() => {
    walletUpdateMany.mockResolvedValue({ count: 1 });
    walletFindUniqueOrThrow.mockResolvedValue({ id: "wallet-1" });
  });

  it("consomme l'émission la plus ancienne en premier, intégralement si elle suffit", async () => {
    transactionFindMany.mockResolvedValue([{ id: "tx-old", remainingAmount: 30 }]);

    await spendCredit({ userId: "u1", amount: 20, motif: "UTILISATION_RESERVATION" });

    expect(transactionUpdate).toHaveBeenCalledWith({
      where: { id: "tx-old" },
      data: { remainingAmount: { decrement: 20 } },
    });
    expect(transactionUpdate).toHaveBeenCalledTimes(1);
  });

  it("déborde sur l'émission suivante si la plus ancienne ne suffit pas (FIFO)", async () => {
    transactionFindMany.mockResolvedValue([
      { id: "tx-old", remainingAmount: 5 },
      { id: "tx-new", remainingAmount: 100 },
    ]);

    await spendCredit({ userId: "u1", amount: 20, motif: "UTILISATION_RESERVATION" });

    expect(transactionUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: "tx-old" },
      data: { remainingAmount: { decrement: 5 } },
    });
    expect(transactionUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: "tx-new" },
      data: { remainingAmount: { decrement: 15 } },
    });
  });

  it("balaie les émissions expirées AVANT de tenter la dépense (solde déjà réduit par la purge)", async () => {
    // Le solde agrégé est la seule source de vérité pour le updateMany gardé
    // ci-dessus (déjà testé) ; ce test vérifie juste l'ORDRE d'appel : le
    // balayage (déclenché par un wallet existant) a lieu avant le
    // prélèvement, jamais après.
    walletFindUnique.mockResolvedValue({ id: "wallet-1" });
    transactionFindMany.mockResolvedValue([]);
    await spendCredit({ userId: "u1", amount: 10, motif: "UTILISATION_RESERVATION" });

    const findManyOrder = transactionFindMany.mock.invocationCallOrder[0];
    const updateManyOrder = walletUpdateMany.mock.invocationCallOrder[0];
    expect(findManyOrder).toBeLessThan(updateManyOrder);
  });
});

describe("refundCreditForBooking (§CR4)", () => {
  it("ne fait rien si aucune dépense de crédit n'est liée à cette résa", async () => {
    transactionFindFirst.mockResolvedValue(null);
    await refundCreditForBooking("booking-1");
    expect(walletUpsert).not.toHaveBeenCalled();
  });

  it("réémet le montant exact dépensé, motif REMBOURSEMENT_RESERVATION_ANNULEE", async () => {
    transactionFindFirst
      .mockResolvedValueOnce({ amount: -20, wallet: { userId: "u1" } }) // la dépense trouvée
      .mockResolvedValueOnce(null); // pas déjà remboursée

    await refundCreditForBooking("booking-1");

    expect(walletUpsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", balance: 20 },
      update: { balance: { increment: 20 } },
    });
    expect(transactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 20,
        motif: "REMBOURSEMENT_RESERVATION_ANNULEE",
        bookingId: "booking-1",
      }),
    });
  });

  it("est idempotent — ne rembourse pas deux fois la même résa", async () => {
    transactionFindFirst
      .mockResolvedValueOnce({ amount: -20, wallet: { userId: "u1" } })
      .mockResolvedValueOnce({ id: "already-refunded" }); // déjà remboursée

    await refundCreditForBooking("booking-1");

    expect(walletUpsert).not.toHaveBeenCalled();
    expect(transactionCreate).not.toHaveBeenCalled();
  });
});

describe("settleHostReferralMilestones (§CR2)", () => {
  it("ne fait rien si aucun filleul", async () => {
    userFindMany.mockResolvedValue([]);
    await settleHostReferralMilestones("parrain-1");
    expect(propertyFindFirst).not.toHaveBeenCalled();
    expect(transactionCreate).not.toHaveBeenCalled();
  });

  it("crédite le parrain quand un filleul a une annonce vérifiée ACTIVE ET une résa TERMINEE", async () => {
    userFindMany.mockResolvedValue([{ id: "filleul-1" }]);
    propertyFindFirst.mockResolvedValue({ id: "prop-1" });
    bookingFindFirst.mockResolvedValue({ id: "booking-1" });

    await settleHostReferralMilestones("parrain-1");

    expect(walletUpsert).toHaveBeenCalledWith({
      where: { userId: "parrain-1" },
      create: { userId: "parrain-1", balance: HOST_REFERRAL_BONUS_TND },
      update: { balance: { increment: HOST_REFERRAL_BONUS_TND } },
    });
    expect(transactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: HOST_REFERRAL_BONUS_TND,
        motif: "PARRAINAGE_FILLEUL_TERMINE",
        referredUserId: "filleul-1",
      }),
    });
  });

  it("ne crédite rien si le filleul n'a pas encore d'annonce vérifiée ACTIVE", async () => {
    userFindMany.mockResolvedValue([{ id: "filleul-1" }]);
    propertyFindFirst.mockResolvedValue(null);

    await settleHostReferralMilestones("parrain-1");

    expect(bookingFindFirst).not.toHaveBeenCalled();
    expect(transactionCreate).not.toHaveBeenCalled();
  });

  it("ne crédite rien si le filleul a une annonce vérifiée mais aucune résa TERMINEE", async () => {
    userFindMany.mockResolvedValue([{ id: "filleul-1" }]);
    propertyFindFirst.mockResolvedValue({ id: "prop-1" });
    bookingFindFirst.mockResolvedValue(null);

    await settleHostReferralMilestones("parrain-1");

    expect(transactionCreate).not.toHaveBeenCalled();
  });

  it("exclut les filleuls déjà récompensés de la recherche (idempotence)", async () => {
    transactionFindMany.mockResolvedValue([{ referredUserId: "deja-recompense" }]);
    userFindMany.mockResolvedValue([]);

    await settleHostReferralMilestones("parrain-1");

    expect(userFindMany).toHaveBeenCalledWith({
      where: { referredById: "parrain-1", id: { notIn: ["deja-recompense"] } },
      select: { id: true },
    });
  });

  it("plafonne à HOST_REFERRAL_YEARLY_CAP filleuls récompensés par an glissant", async () => {
    transactionCount.mockResolvedValue(HOST_REFERRAL_YEARLY_CAP);
    userFindMany.mockResolvedValue([{ id: "filleul-1" }]);

    await settleHostReferralMilestones("parrain-1");

    expect(userFindMany).not.toHaveBeenCalled();
    expect(transactionCreate).not.toHaveBeenCalled();
  });

  it("s'arrête dès que le plafond annuel est atteint en cours de boucle (plusieurs candidats)", async () => {
    transactionCount.mockResolvedValue(HOST_REFERRAL_YEARLY_CAP - 1); // 1 slot restant
    userFindMany.mockResolvedValue([{ id: "filleul-1" }, { id: "filleul-2" }]);
    propertyFindFirst.mockResolvedValue({ id: "prop-1" });
    bookingFindFirst.mockResolvedValue({ id: "booking-1" });

    await settleHostReferralMilestones("parrain-1");

    expect(transactionCreate).toHaveBeenCalledTimes(1);
    expect(transactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ referredUserId: "filleul-1" }),
    });
  });
});

describe("computeCreditApplication", () => {
  it("plafonne à 30 % du total quand c'est la contrainte la plus stricte", () => {
    // reste-à-couvrir (totalPrice - subtotal) = 400, largement au-dessus de
    // 30 % du total (300) — c'est bien le taux qui plafonne ici, pas la
    // commission (scénario synthétique, pas atteignable avec le taux de
    // service réel de 8 % — cf. booking-credit-application.test.ts pour le
    // cas réel où c'est systématiquement le reste-à-couvrir qui plafonne).
    expect(
      computeCreditApplication({ balance: 100000, totalPrice: 1000, subtotal: 600 })
    ).toBe(300);
  });

  it("plafonne au reste-à-couvrir (jamais sous le subtotal) quand il est plus strict que 30 %", () => {
    expect(
      computeCreditApplication({ balance: 100000, totalPrice: 648, subtotal: 600 })
    ).toBe(48);
  });

  it("plafonne au solde si c'est la contrainte la plus stricte", () => {
    expect(computeCreditApplication({ balance: 10, totalPrice: 648, subtotal: 600 })).toBe(10);
  });

  it("renvoie 0 si le solde est nul", () => {
    expect(computeCreditApplication({ balance: 0, totalPrice: 648, subtotal: 600 })).toBe(0);
  });

  it("ne renvoie jamais un montant négatif (totalPrice déjà planchéré à subtotal ailleurs)", () => {
    expect(computeCreditApplication({ balance: 100, totalPrice: 600, subtotal: 600 })).toBe(0);
  });

  it("arrondit à l'entier TND", () => {
    // 30 % de 333 = 99.9 → arrondi 100 ; reste-à-couvrir = 133, solde = 1000.
    expect(computeCreditApplication({ balance: 1000, totalPrice: 333, subtotal: 200 })).toBe(100);
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

describe("grantWelcomeCreditIfEligible (§CR3)", () => {
  it("émet le crédit de bienvenue si aucun bonus n'a jamais été accordé", async () => {
    transactionFindFirst.mockResolvedValue(null);

    await grantWelcomeCreditIfEligible("u1");

    expect(transactionFindFirst).toHaveBeenCalledWith({
      where: { wallet: { userId: "u1" }, motif: { in: ["BIENVENUE_PARRAINAGE", "BIENVENUE_SPONTANE"] } },
      select: { id: true },
    });
    expect(walletUpsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", balance: 10 },
      update: { balance: { increment: 10 } },
    });
    expect(transactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ amount: 10, motif: "BIENVENUE_SPONTANE" }),
    });
  });

  it("ne fait rien si le compte a déjà reçu le bonus filleul (§CR1) — jamais cumulé", async () => {
    transactionFindFirst.mockResolvedValue({ id: "tx-parrainage" });

    await grantWelcomeCreditIfEligible("u1");

    expect(walletUpsert).not.toHaveBeenCalled();
    expect(transactionCreate).not.toHaveBeenCalled();
  });

  it("ne fait rien si ce compte a déjà reçu ce même bonus (idempotence sur re-vérification téléphone)", async () => {
    transactionFindFirst.mockResolvedValue({ id: "tx-spontane" });

    await grantWelcomeCreditIfEligible("u1");

    expect(walletUpsert).not.toHaveBeenCalled();
    expect(transactionCreate).not.toHaveBeenCalled();
  });
});
