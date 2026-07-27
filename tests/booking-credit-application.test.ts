/**
 * CR1 (CROISSANCE_ROADMAP.md) — application du solde de crédit au checkout :
 * aperçu au devis (quoteBookingAction, lecture seule) et dépense atomique à la
 * création (createBookingAction, couplée à la transaction de réservation).
 * Plafonds non négociables (§L5.1) : jamais plus de 100 % des FRAIS Darna
 * restants (jamais du total, que Darna ne touche plus), jamais au-delà du
 * reste-à-couvrir (`totalPrice - subtotal`) — le prix hôte ne bouge jamais.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn(), findFirst: vi.fn() },
    creditWallet: { findUnique: vi.fn(), update: vi.fn() },
    // sweepExpiredCredits (§CR4) : aucune émission à balayer par défaut dans
    // ces tests CR1 — le comportement de la purge est couvert par
    // credits.test.ts, pas ici.
    creditTransaction: { findMany: vi.fn().mockResolvedValue([]), update: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn(), getSessionUser: vi.fn() }));
vi.mock("@/lib/host-invoicing", () => ({ hasOverdueHostInvoice: vi.fn(() => false) }));
vi.mock("@/lib/suspension", () => ({ isSuspended: vi.fn(() => false) }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/konnect", () => ({ isKonnectEnabled: vi.fn(() => false) }));
vi.mock("@/lib/notification-center", () => ({ notifyCashBookingRequested: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    booking: {
      verifRequise: "Vérification requise.",
      datesInvalides: "Dates invalides.",
      datesIndisponibles: "Dates indisponibles.",
      proprietaireImpossible: "Impossible.",
      capaciteDepassee: (n: number) => `Capacité dépassée (${n}).`,
      cashNonDisponible: "Cash indisponible.",
      cashKycRequis: "KYC requis.",
      compteSuspendu: "Compte suspendu.",
    },
  }),
}));

import { createBookingAction, quoteBookingAction } from "@/actions/bookings";
import { prisma } from "@/lib/prisma";
import { requireUser, getSessionUser } from "@/lib/session";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const propertyFindFirst = prisma.property.findFirst as unknown as Mock;
const walletFindUnique = prisma.creditWallet.findUnique as unknown as Mock;
const txRun = prisma.$transaction as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const getSessionUserMock = getSessionUser as unknown as Mock;

const DAY = 24 * 60 * 60 * 1000;
const GUEST_ID = "guest-1";
const SLUG = "villa-hammamet-abc123";

const verifiedGuest = {
  id: GUEST_ID,
  role: "VOYAGEUR",
  kycStatus: "VERIFIE",
  phoneVerified: true,
  emailVerified: true,
};

function ymd(offset: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

// 300 TND/nuit × 2 nuits = subtotal 600, serviceFee 60 (10 %), fullTotal 660.
function baseProperty(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "clproperty000000000000001",
    type: "SEJOUR",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 30 * DAY),
    price: 300,
    verified: true,
    promoPrice: null,
    promoUntil: null,
    stay: { maxGuests: 4 },
    ownerId: "owner-1",
    cashPaymentEnabled: false,
    cancelBlockedUntil: null,
    ...overrides,
  };
}

function quoteInput(useCredits?: boolean) {
  return { slug: SLUG, arrivee: ymd(10), depart: ymd(12), voyageurs: 2, useCredits };
}

function bookingForm(useCredits?: "true" | "false"): FormData {
  const fd = new FormData();
  fd.set("slug", SLUG);
  fd.set("arrivee", ymd(10));
  fd.set("depart", ymd(12));
  fd.set("voyageurs", "2");
  if (useCredits) fd.set("useCredits", useCredits);
  return fd;
}

/** tx mock minimal pour createBookingAction — booking + creditWallet/creditTransaction. */
function mockTx(opts: { walletUpdateManyCount: number; walletId?: string }) {
  const create = vi.fn().mockResolvedValue({ id: "clbooking0000000000000001", totalPrice: 0 });
  const tx = {
    booking: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), create, update: vi.fn() },
    property: { findFirst: vi.fn().mockResolvedValue(null) },
    creditWallet: {
      // sweepExpiredCredits (§CR4) : pas de wallet préexistant dans ce
      // scénario CR1 → sweep no-op immédiat, cf. credits.test.ts pour la purge.
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({ id: opts.walletId ?? "wallet-1" }),
      updateMany: vi.fn().mockResolvedValue({ count: opts.walletUpdateManyCount }),
      findUniqueOrThrow: vi.fn().mockResolvedValue({ id: opts.walletId ?? "wallet-1" }),
    },
    creditTransaction: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  };
  return { tx, create };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue(verifiedGuest);
  getSessionUserMock.mockResolvedValue(null);
  propertyFindFirst.mockResolvedValue(null); // aucun conflit de dates
  propertyFindUnique.mockResolvedValue(baseProperty());
});

describe("quoteBookingAction — aperçu crédit (§CR1)", () => {
  it("n'applique rien si useCredits absent, même avec un solde disponible", async () => {
    getSessionUserMock.mockResolvedValue(verifiedGuest);
    walletFindUnique.mockResolvedValue({ balance: 100 });

    const quote = await quoteBookingAction(quoteInput());

    expect(quote).toMatchObject({ ok: true, total: 660, creditApplied: undefined });
    expect(walletFindUnique).not.toHaveBeenCalled();
  });

  it("n'applique rien pour un visiteur anonyme, même avec useCredits=true", async () => {
    getSessionUserMock.mockResolvedValue(null);

    const quote = await quoteBookingAction(quoteInput(true));

    expect(quote).toMatchObject({ ok: true, total: 660, creditApplied: undefined });
    expect(walletFindUnique).not.toHaveBeenCalled();
  });

  it("applique le crédit disponible, plafonné au reste-à-couvrir (totalPrice - subtotal = 60 = 100 % des frais)", async () => {
    getSessionUserMock.mockResolvedValue(verifiedGuest);
    walletFindUnique.mockResolvedValue({ balance: 200 });

    const quote = await quoteBookingAction(quoteInput(true));

    expect(quote).toMatchObject({ ok: true, total: 660 - 60, creditApplied: 60 });
  });

  it("plafonne au solde réel si inférieur au plafond (100 % des frais)", async () => {
    getSessionUserMock.mockResolvedValue(verifiedGuest);
    walletFindUnique.mockResolvedValue({ balance: 15 });

    const quote = await quoteBookingAction(quoteInput(true));

    expect(quote).toMatchObject({ ok: true, total: 660 - 15, creditApplied: 15 });
  });

  it("ne descend jamais sous le subtotal (prix hôte protégé), même avec un solde énorme", async () => {
    getSessionUserMock.mockResolvedValue(verifiedGuest);
    walletFindUnique.mockResolvedValue({ balance: 100000 });

    const quote = await quoteBookingAction(quoteInput(true));

    // Plancher = subtotal (600) → crédit max = totalPrice - subtotal = 60 (= serviceFee entier).
    expect(quote).toMatchObject({ ok: true, total: 600, creditApplied: 60 });
  });
});

describe("createBookingAction — dépense crédit atomique (§CR1)", () => {
  it("dépense le crédit dans LA MÊME transaction et réduit totalPrice", async () => {
    walletFindUnique.mockResolvedValue({ balance: 300 }); // lu HORS transaction (aperçu avant tx)
    const { tx } = mockTx({ walletUpdateManyCount: 1 });
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const result = await cb(tx);
      return result;
    });
    (tx.booking.create as unknown as Mock).mockResolvedValue({
      id: "clbooking0000000000000001",
      totalPrice: 660 - 60,
    });

    await createBookingAction(undefined, bookingForm("true"));

    expect(tx.creditWallet.updateMany).toHaveBeenCalledWith({
      where: { userId: GUEST_ID, balance: { gte: 60 } },
      data: { balance: { decrement: 60 } },
    });
    expect((tx.booking.create as unknown as Mock).mock.calls[0][0].data).toMatchObject({
      totalPrice: 660 - 60,
      // §L5.1 : le crédit doit réduire ce qui est RÉELLEMENT débité en ligne
      // (totalPrice - subtotal = 0 ici, le crédit couvre tous les frais
      // restants), pas seulement le totalPrice affiché — sinon le solde
      // cash à l'arrivée (totalPrice - amountPaid) se retrouverait sous le
      // loyer réel dû à l'hôte.
      depositAmount: 0,
    });
  });

  it("ne dépense rien si useCredits=false, même avec un solde disponible", async () => {
    walletFindUnique.mockResolvedValue({ balance: 300 });
    const { tx, create } = mockTx({ walletUpdateManyCount: 1 });
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));
    create.mockResolvedValue({ id: "clbooking0000000000000001", totalPrice: 660 });

    await createBookingAction(undefined, bookingForm("false"));

    expect(tx.creditWallet.updateMany).not.toHaveBeenCalled();
    expect(create.mock.calls[0][0].data).toMatchObject({ totalPrice: 660, depositAmount: 60 });
  });

  it("laisse totalPrice inchangé si la dépense échoue (solde épuisé entre-temps, count=0)", async () => {
    walletFindUnique.mockResolvedValue({ balance: 300 }); // aperçu optimiste hors tx
    const { tx, create } = mockTx({ walletUpdateManyCount: 0 }); // mais la dépense réelle échoue
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx));
    create.mockResolvedValue({ id: "clbooking0000000000000001", totalPrice: 660 });

    await createBookingAction(undefined, bookingForm("true"));

    expect(create.mock.calls[0][0].data).toMatchObject({ totalPrice: 660, depositAmount: 60 });
    expect(tx.creditTransaction.create).not.toHaveBeenCalled();
  });
});
