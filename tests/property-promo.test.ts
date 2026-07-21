/**
 * PM0 (CROISSANCE_ROADMAP.md) — fondations promo hôte.
 *
 * Prouve : le prix promo n'est jamais accepté en aveugle côté serveur
 * (toujours < price, annonce ACTIVE + vérifiée, date de fin future dans un
 * délai raisonnable), IDOR sur la définition/le retrait, et le calcul du
 * prix effectif (listings.ts) qui alimente la réservation.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { property: { findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn(), requireLister: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { erreurInconnue: "Erreur inconnue.", champsRequis: "Champs requis." },
    annonceForm: {
      promoAnnonceNonEligible: "Annonce non éligible.",
      promoPrixInvalide: "Prix promo invalide.",
      promoDateInvalide: "Date promo invalide.",
      promoDefinie: "Promo activée.",
    },
  }),
}));

import { setPropertyPromoAction, clearPropertyPromoAction } from "@/actions/properties";
import { isPropertyPromoActive, effectiveNightlyPrice } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { requireUser, requireLister } from "@/lib/session";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const propertyUpdate = prisma.property.update as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const requireListerMock = requireLister as unknown as Mock;

const DAY = 24 * 60 * 60 * 1000;
const OWNER = { id: "owner-A", role: "HOTE" };
const ATTACKER = { id: "attacker-B", role: "HOTE" };
const PROP_ID = "clproperty000000000000001";

function eligibleProperty(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: PROP_ID,
    ownerId: OWNER.id,
    type: "SEJOUR",
    slug: "villa-hammamet",
    title: "Villa",
    cashPaymentEnabled: false,
    price: 300,
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 10 * DAY),
    verified: true,
    ...overrides,
  };
}

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

function ymd(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue(OWNER);
  requireListerMock.mockResolvedValue(OWNER);
  propertyUpdate.mockResolvedValue({});
});

describe("isPropertyPromoActive / effectiveNightlyPrice", () => {
  it("aucune promo (promoUntil null) → jamais active", () => {
    expect(isPropertyPromoActive(null)).toBe(false);
  });

  it("promoUntil passé → inactive (lazy-expiry, même principe que featuredUntil)", () => {
    expect(isPropertyPromoActive(new Date(Date.now() - DAY))).toBe(false);
  });

  it("promoUntil futur → active", () => {
    expect(isPropertyPromoActive(new Date(Date.now() + DAY))).toBe(true);
  });

  it("effectiveNightlyPrice retourne le prix normal si aucune promo", () => {
    expect(
      effectiveNightlyPrice({ price: 300, promoPrice: null, promoUntil: null, verified: true })
    ).toBe(300);
  });

  it("effectiveNightlyPrice retourne le prix promo si actif et l'annonce vérifiée", () => {
    expect(
      effectiveNightlyPrice({
        price: 300,
        promoPrice: 250,
        promoUntil: new Date(Date.now() + DAY),
        verified: true,
      })
    ).toBe(250);
  });

  it("effectiveNightlyPrice ignore une promo expirée", () => {
    expect(
      effectiveNightlyPrice({
        price: 300,
        promoPrice: 250,
        promoUntil: new Date(Date.now() - DAY),
        verified: true,
      })
    ).toBe(300);
  });

  it("effectiveNightlyPrice ignore la promo si l'annonce n'est plus vérifiée", () => {
    expect(
      effectiveNightlyPrice({
        price: 300,
        promoPrice: 250,
        promoUntil: new Date(Date.now() + DAY),
        verified: false,
      })
    ).toBe(300);
  });
});

describe("setPropertyPromoAction", () => {
  it("IDOR : rejette un hôte qui n'est pas propriétaire (aucune écriture)", async () => {
    requireUserMock.mockResolvedValue(ATTACKER);
    requireListerMock.mockResolvedValue(ATTACKER);
    propertyFindUnique.mockResolvedValue(eligibleProperty());

    const result = await setPropertyPromoAction(
      undefined,
      form({ propertyId: PROP_ID, promoPrice: "250", promoUntil: ymd(10) })
    );

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("refuse un prix promo >= au prix normal (non-bypass serveur, jamais confiance au client)", async () => {
    propertyFindUnique.mockResolvedValue(eligibleProperty({ price: 300 }));

    const result = await setPropertyPromoAction(
      undefined,
      form({ propertyId: PROP_ID, promoPrice: "300", promoUntil: ymd(10) })
    );

    expect(result).toEqual({ error: "Prix promo invalide." });
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("refuse une annonce non vérifiée", async () => {
    propertyFindUnique.mockResolvedValue(eligibleProperty({ verified: false }));

    const result = await setPropertyPromoAction(
      undefined,
      form({ propertyId: PROP_ID, promoPrice: "250", promoUntil: ymd(10) })
    );

    expect(result).toEqual({ error: "Annonce non éligible." });
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("refuse une annonce non ACTIVE", async () => {
    propertyFindUnique.mockResolvedValue(eligibleProperty({ status: "LOUE" }));

    const result = await setPropertyPromoAction(
      undefined,
      form({ propertyId: PROP_ID, promoPrice: "250", promoUntil: ymd(10) })
    );

    expect(result).toEqual({ error: "Annonce non éligible." });
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("refuse une date de fin dans le passé", async () => {
    propertyFindUnique.mockResolvedValue(eligibleProperty());

    const result = await setPropertyPromoAction(
      undefined,
      form({ propertyId: PROP_ID, promoPrice: "250", promoUntil: ymd(-1) })
    );

    expect(result).toEqual({ error: "Date promo invalide." });
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("refuse une date de fin trop lointaine (> 365 jours, non-bypass)", async () => {
    propertyFindUnique.mockResolvedValue(eligibleProperty());

    const result = await setPropertyPromoAction(
      undefined,
      form({ propertyId: PROP_ID, promoPrice: "250", promoUntil: ymd(400) })
    );

    expect(result).toEqual({ error: "Date promo invalide." });
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("définit la promo (chemin nominal)", async () => {
    propertyFindUnique.mockResolvedValue(eligibleProperty());

    const result = await setPropertyPromoAction(
      undefined,
      form({ propertyId: PROP_ID, promoPrice: "250", promoUntil: ymd(10) })
    );

    expect(result).toEqual({ success: "Promo activée." });
    expect(propertyUpdate).toHaveBeenCalledWith({
      where: { id: PROP_ID },
      data: { promoPrice: 250, promoUntil: expect.any(Date) },
    });
  });
});

describe("clearPropertyPromoAction", () => {
  it("IDOR : ignore le retrait par un autre hôte (aucune écriture)", async () => {
    requireUserMock.mockResolvedValue(ATTACKER);
    propertyFindUnique.mockResolvedValue(eligibleProperty());

    await clearPropertyPromoAction(form({ propertyId: PROP_ID }));

    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("retire la promo (chemin nominal)", async () => {
    propertyFindUnique.mockResolvedValue(eligibleProperty());

    await clearPropertyPromoAction(form({ propertyId: PROP_ID }));

    expect(propertyUpdate).toHaveBeenCalledWith({
      where: { id: PROP_ID },
      data: { promoPrice: null, promoUntil: null },
    });
  });
});
