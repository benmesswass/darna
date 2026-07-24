/**
 * GROWTH_ROADMAP.md §G1 — simulateur public de revenus (estimateRevenue).
 * Fourchette dérivée UNIQUEMENT des agrégats de computeMarketIndex() (prisma
 * mocké, cache court-circuité pour éviter toute pollution entre tests).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/cache", () => ({
  cached: (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { property: { findMany: vi.fn() } },
}));

// src/lib/market.ts importe activeListingWhere() depuis src/lib/listings.ts,
// qui importe à son tour next-auth (session) et next/headers (product-events)
// au niveau module — mockés ici même si estimateRevenue() ne les appelle pas,
// même idiome que tests/listings.test.ts.
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/product-events", () => ({ logProductEvent: vi.fn(), getAnonId: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { estimateRevenue } from "@/lib/market";

const findMany = prisma.property.findMany as unknown as Mock;

// Nabeul (gouvernorat de Hammamet, cf. src/lib/geo.ts) : LOCATION 10 et 15
// TND/m² → moyenne 12.5 arrondie à 13 ; VENTE 2000 TND/m² (1 seule annonce).
const withSurfaceFixture = [
  { type: "LOCATION", gouvernorat: "Nabeul", price: 1000, surface: 100 },
  { type: "LOCATION", gouvernorat: "Nabeul", price: 1500, surface: 100 },
  { type: "VENTE", gouvernorat: "Nabeul", price: 200_000, surface: 100 },
];
// Hammamet : nuitées 100 et 200 TND → moyenne 150 TND.
const sejoursFixture = [
  { city: "Hammamet", price: 100 },
  { city: "Hammamet", price: 200 },
];

beforeEach(() => {
  vi.clearAllMocks();
  findMany.mockImplementation((args: { where: { type?: unknown } }) => {
    if (args.where.type === "SEJOUR") return Promise.resolve(sejoursFixture);
    return Promise.resolve(withSurfaceFixture);
  });
});

describe("estimateRevenue — séjour", () => {
  it("calcule une fourchette mensuelle à partir de la nuitée moyenne réelle de la ville", async () => {
    const result = await estimateRevenue({ city: "Hammamet", type: "SEJOUR" });
    expect(result.matched).toBe(true);
    expect(result.sampleSize).toBe(2);
    expect(result.unit).toBe("NUITEE");
    // 150 TND × 30 nuits × [35 %, 60 %]
    expect(result.monthlyLow).toBe(1575);
    expect(result.monthlyHigh).toBe(2700);
  });

  it("renvoie matched=false pour une ville sans aucune donnée séjour réelle", async () => {
    const result = await estimateRevenue({ city: "Tozeur", type: "SEJOUR" });
    expect(result.matched).toBe(false);
    expect(result.sampleSize).toBe(0);
    expect(result.monthlyLow).toBeNull();
    expect(result.monthlyHigh).toBeNull();
  });
});

describe("estimateRevenue — location (longue durée)", () => {
  it("calcule un loyer mensuel à partir du TND/m² moyen du gouvernorat × surface", async () => {
    const result = await estimateRevenue({ city: "Hammamet", type: "LOCATION", surface: 50 });
    expect(result.matched).toBe(true);
    expect(result.unit).toBe("LOYER_MENSUEL");
    expect(result.sampleSize).toBe(2);
    // 13 TND/m² × 50 m² = 650 ; bande ±15 % (747 pas 748 : 650×1.15 = 747.4999…9 en flottant).
    expect(result.monthlyLow).toBe(553);
    expect(result.monthlyHigh).toBe(747);
  });

  it("ne calcule aucune fourchette sans surface, même si le gouvernorat a des données", async () => {
    const result = await estimateRevenue({ city: "Hammamet", type: "LOCATION" });
    expect(result.matched).toBe(false);
    expect(result.sampleSize).toBe(2);
    expect(result.monthlyLow).toBeNull();
  });

  it("renvoie matched=false et sampleSize=0 pour un gouvernorat sans donnée location", async () => {
    const result = await estimateRevenue({ city: "Tunis", type: "LOCATION", surface: 50 });
    expect(result.matched).toBe(false);
    expect(result.sampleSize).toBe(0);
  });
});

describe("estimateRevenue — vente", () => {
  it("estime un prix de vente à partir du TND/m² moyen du gouvernorat × surface", async () => {
    const result = await estimateRevenue({ city: "Hammamet", type: "VENTE", surface: 100 });
    expect(result.matched).toBe(true);
    expect(result.unit).toBe("PRIX_VENTE");
    expect(result.sampleSize).toBe(1);
    expect(result.monthlyLow).toBe(170_000);
    expect(result.monthlyHigh).toBe(230_000);
  });
});
