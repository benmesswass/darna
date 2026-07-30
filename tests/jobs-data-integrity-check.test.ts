/**
 * P5.2 (ROADMAP.md) — balayage d'intégrité des données. Toutes les FK
 * couvertes sont déjà appliquées par Postgres/Prisma en fonctionnement
 * normal : ces tests vérifient que la détection fonctionne SI jamais une
 * incohérence apparaissait (migration ratée, manipulation hors app), pas un
 * scénario atteignable via l'application elle-même.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findMany: vi.fn(), count: vi.fn() },
    property: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
    hostInvoice: { findMany: vi.fn() },
    creditWallet: { findMany: vi.fn() },
    creditTransaction: { groupBy: vi.fn() },
  },
}));
vi.mock("@/lib/observability", () => ({ captureError: vi.fn() }));

import { checkDataIntegrity } from "@/lib/jobs/data-integrity-check";
import { prisma } from "@/lib/prisma";
import { captureError } from "@/lib/observability";

const bookingFindMany = prisma.booking.findMany as unknown as Mock;
const bookingCount = prisma.booking.count as unknown as Mock;
const propertyFindMany = prisma.property.findMany as unknown as Mock;
const userFindMany = prisma.user.findMany as unknown as Mock;
const hostInvoiceFindMany = prisma.hostInvoice.findMany as unknown as Mock;
const creditWalletFindMany = prisma.creditWallet.findMany as unknown as Mock;
const creditTransactionGroupBy = prisma.creditTransaction.groupBy as unknown as Mock;
const captureErrorMock = captureError as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  // État "sain" par défaut : chaque booking.findMany est appelé 2x avec des
  // `distinct` différents (propertyId puis guestId) — mockResolvedValue
  // couvre les deux avec une réponse vide cohérente.
  bookingFindMany.mockResolvedValue([]);
  bookingCount.mockResolvedValue(0);
  propertyFindMany.mockResolvedValue([]);
  userFindMany.mockResolvedValue([]);
  hostInvoiceFindMany.mockResolvedValue([]);
  creditWalletFindMany.mockResolvedValue([]);
  creditTransactionGroupBy.mockResolvedValue([]);
});

describe("checkDataIntegrity — état sain", () => {
  it("ne remonte aucun problème et n'alerte pas", async () => {
    const result = await checkDataIntegrity();

    expect(result.totalIssues).toBe(0);
    expect(captureErrorMock).not.toHaveBeenCalled();
  });
});

describe("checkDataIntegrity — réservation sans annonce (FK propertyId)", () => {
  it("détecte un propertyId de réservation qui ne correspond à aucune Property", async () => {
    bookingFindMany.mockImplementation(async ({ distinct }: { distinct?: string[] }) => {
      if (distinct?.[0] === "propertyId") return [{ propertyId: "prop-fantome" }];
      return [];
    });
    propertyFindMany.mockResolvedValue([{ id: "prop-existante" }]);

    const result = await checkDataIntegrity();

    expect(result.orphanBookingProperties).toEqual(["prop-fantome"]);
    expect(result.totalIssues).toBe(1);
    expect(captureErrorMock).toHaveBeenCalledTimes(1);
    expect(captureErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        event: "data_integrity_check.findings",
        orphanBookingProperties: ["prop-fantome"],
      })
    );
  });
});

describe("checkDataIntegrity — réservation sans voyageur (FK guestId)", () => {
  it("détecte un guestId de réservation qui ne correspond à aucun User", async () => {
    bookingFindMany.mockImplementation(async ({ distinct }: { distinct?: string[] }) => {
      if (distinct?.[0] === "guestId") return [{ guestId: "user-fantome" }];
      return [];
    });
    userFindMany.mockResolvedValue([{ id: "user-existant" }]);

    const result = await checkDataIntegrity();

    expect(result.orphanBookingGuests).toEqual(["user-fantome"]);
    expect(result.totalIssues).toBe(1);
  });
});

describe("checkDataIntegrity — facture sans réservation", () => {
  it("détecte un bookingId de HostInvoice qui ne correspond à aucune Booking", async () => {
    hostInvoiceFindMany.mockResolvedValue([{ bookingId: "booking-fantome" }]);
    // booking.findMany est aussi appelé (sans `distinct`) par les autres
    // checks (propertyId/guestId orphelins) : ne répondre "booking-existante"
    // QUE pour l'appel sans distinct (celui du check HostInvoice→Booking).
    bookingFindMany.mockImplementation(async ({ distinct }: { distinct?: string[] } = {}) =>
      distinct ? [] : [{ id: "booking-existante" }]
    );

    const result = await checkDataIntegrity();

    expect(result.orphanHostInvoiceBookings).toEqual(["booking-fantome"]);
    expect(result.totalIssues).toBe(1);
  });
});

describe("checkDataIntegrity — escrow anormal", () => {
  it("remonte le compte de réservations avec escrow ≠ AUCUN (jamais censé arriver, séquestre inerte)", async () => {
    bookingCount.mockResolvedValue(2);

    const result = await checkDataIntegrity();

    expect(bookingCount).toHaveBeenCalledWith({ where: { escrow: { not: "AUCUN" } } });
    expect(result.escrowAnomalyCount).toBe(2);
    expect(result.totalIssues).toBe(2);
  });
});

describe("checkDataIntegrity — ledger de crédits désynchronisé du solde du wallet", () => {
  it("détecte un wallet dont le solde ne correspond pas à la somme du ledger", async () => {
    creditWalletFindMany.mockResolvedValue([
      { id: "wallet-1", balance: 50 },
      { id: "wallet-2", balance: 20 },
    ]);
    creditTransactionGroupBy.mockResolvedValue([
      { walletId: "wallet-1", _sum: { amount: 50 } }, // cohérent
      { walletId: "wallet-2", _sum: { amount: 15 } }, // divergent (balance=20)
    ]);

    const result = await checkDataIntegrity();

    expect(result.creditLedgerMismatches).toEqual([
      { walletId: "wallet-2", balance: 20, ledgerSum: 15 },
    ]);
    expect(result.totalIssues).toBe(1);
  });

  it("traite un wallet sans transaction (ledgerSum absent du groupBy) comme une somme de 0", async () => {
    creditWalletFindMany.mockResolvedValue([{ id: "wallet-3", balance: 5 }]);
    creditTransactionGroupBy.mockResolvedValue([]); // aucune transaction pour ce wallet

    const result = await checkDataIntegrity();

    expect(result.creditLedgerMismatches).toEqual([
      { walletId: "wallet-3", balance: 5, ledgerSum: 0 },
    ]);
  });
});

describe("checkDataIntegrity — plusieurs catégories à la fois", () => {
  it("cumule totalIssues sur toutes les catégories et alerte une seule fois", async () => {
    bookingCount.mockResolvedValue(1); // 1 anomalie escrow
    hostInvoiceFindMany.mockResolvedValue([{ bookingId: "booking-fantome" }]);
    bookingFindMany.mockImplementation(async ({ distinct }: { distinct?: string[] } = {}) => {
      if (!distinct) return []; // hostInvoice check appelle booking.findMany SANS distinct
      return [];
    });

    const result = await checkDataIntegrity();

    expect(result.totalIssues).toBe(2); // 1 escrow + 1 facture orpheline
    expect(captureErrorMock).toHaveBeenCalledTimes(1);
  });
});
