/**
 * MONETISATION_IMMO_ROADMAP.md §MI2 — dérivation de la limite d'annonces
 * actives à partir du rôle et de l'abonnement. Le mécanisme ne cible que les
 * comptes AGENCE (jamais les hôtes individuels), et `EXPIRE` est un dérivé
 * (jamais un statut stocké) : un abonnement ACTIF dont `currentPeriodEnd` est
 * dépassée ne compte plus comme actif.
 */
import { describe, expect, it } from "vitest";
import {
  activeListingsLimit,
  cheapestPlanForQuota,
  hasUnclaimedFreeBoost,
  isSubscriptionActive,
  listingUnitCost,
} from "@/lib/subscriptions";
import { FREE_TIER_LISTINGS_LIMIT } from "@/lib/config";
import { AGENCY_PLANS } from "@/lib/constants";

const STANDARD = AGENCY_PLANS[0];
const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

describe("isSubscriptionActive", () => {
  it("false pour null (aucun abonnement)", () => {
    expect(isSubscriptionActive(null)).toBe(false);
  });

  it("false pour un statut EN_ATTENTE", () => {
    expect(isSubscriptionActive({ status: "EN_ATTENTE", plan: STANDARD.key, currentPeriodEnd: future })).toBe(
      false
    );
  });

  it("false pour un statut ACTIF dont la période est dépassée (EXPIRE dérivé)", () => {
    expect(isSubscriptionActive({ status: "ACTIF", plan: STANDARD.key, currentPeriodEnd: past })).toBe(false);
  });

  it("true pour un statut ACTIF dont la période est future", () => {
    expect(isSubscriptionActive({ status: "ACTIF", plan: STANDARD.key, currentPeriodEnd: future })).toBe(true);
  });

  it("true pour un statut ACTIF sans date de fin (ne devrait pas arriver mais reste sûr)", () => {
    expect(isSubscriptionActive({ status: "ACTIF", plan: STANDARD.key, currentPeriodEnd: null })).toBe(true);
  });
});

describe("activeListingsLimit", () => {
  it("illimité pour un compte HOTE, même sans abonnement", () => {
    expect(activeListingsLimit("HOTE", null)).toBe(Infinity);
  });

  it("illimité pour un compte HOTE même avec une ligne Subscription (ne devrait jamais arriver)", () => {
    expect(
      activeListingsLimit("HOTE", { status: "ACTIF", plan: STANDARD.key, currentPeriodEnd: future })
    ).toBe(Infinity);
  });

  it("palier gratuit pour un compte AGENCE sans abonnement", () => {
    expect(activeListingsLimit("AGENCE", null)).toBe(FREE_TIER_LISTINGS_LIMIT);
  });

  it("palier gratuit pour un compte AGENCE dont l'abonnement est expiré", () => {
    expect(
      activeListingsLimit("AGENCE", { status: "ACTIF", plan: STANDARD.key, currentPeriodEnd: past })
    ).toBe(FREE_TIER_LISTINGS_LIMIT);
  });

  it("quota du palier pour un compte AGENCE avec un abonnement ACTIF", () => {
    expect(
      activeListingsLimit("AGENCE", { status: "ACTIF", plan: STANDARD.key, currentPeriodEnd: future })
    ).toBe(STANDARD.listingsIncluded);
  });

  it("palier gratuit si le plan stocké est inconnu (défense en profondeur)", () => {
    expect(
      activeListingsLimit("AGENCE", { status: "ACTIF", plan: "INEXISTANT", currentPeriodEnd: future })
    ).toBe(FREE_TIER_LISTINGS_LIMIT);
  });
});

describe("hasUnclaimedFreeBoost", () => {
  const PRO = AGENCY_PLANS.find((p) => p.key === "PRO")!;
  const NON_BOOST_PLAN = AGENCY_PLANS.find((p) => !p.freeBoostPerCycle)!;

  it("false pour null (aucun abonnement)", () => {
    expect(hasUnclaimedFreeBoost(null)).toBe(false);
  });

  it("false pour un abonnement EN_ATTENTE (pas encore actif)", () => {
    expect(
      hasUnclaimedFreeBoost({
        status: "EN_ATTENTE",
        plan: PRO.key,
        currentPeriodEnd: future,
        freeBoostUsedAt: null,
      })
    ).toBe(false);
  });

  it("false pour un abonnement ACTIF mais expiré (EXPIRE dérivé)", () => {
    expect(
      hasUnclaimedFreeBoost({
        status: "ACTIF",
        plan: PRO.key,
        currentPeriodEnd: past,
        freeBoostUsedAt: null,
      })
    ).toBe(false);
  });

  it("false pour un palier sans freeBoostPerCycle", () => {
    expect(
      hasUnclaimedFreeBoost({
        status: "ACTIF",
        plan: NON_BOOST_PLAN.key,
        currentPeriodEnd: future,
        freeBoostUsedAt: null,
      })
    ).toBe(false);
  });

  it("false si le boost du cycle est déjà consommé (non cumulable)", () => {
    expect(
      hasUnclaimedFreeBoost({
        status: "ACTIF",
        plan: PRO.key,
        currentPeriodEnd: future,
        freeBoostUsedAt: new Date(),
      })
    ).toBe(false);
  });

  it("true pour un abonnement Pro actif n'ayant pas encore consommé son boost ce cycle", () => {
    expect(
      hasUnclaimedFreeBoost({
        status: "ACTIF",
        plan: PRO.key,
        currentPeriodEnd: future,
        freeBoostUsedAt: null,
      })
    ).toBe(true);
  });
});

describe("listingUnitCost", () => {
  it("ramène le prix du palier au coût par annonce active incluse", () => {
    expect(listingUnitCost({ priceTND: 250, listingsIncluded: 20 })).toBe(12.5);
  });

  it("arrondit à une décimale", () => {
    expect(listingUnitCost({ priceTND: 100, listingsIncluded: 3 })).toBe(33.3);
  });
});

describe("cheapestPlanForQuota", () => {
  const sorted = [...AGENCY_PLANS].sort((a, b) => a.listingsIncluded - b.listingsIncluded);

  it("retourne le palier le moins cher qui couvre exactement le besoin", () => {
    expect(cheapestPlanForQuota(sorted[0].listingsIncluded).key).toBe(sorted[0].key);
  });

  it("ne recommande jamais un palier insuffisant pour le besoin réel", () => {
    const needed = sorted[0].listingsIncluded + 1;
    const result = cheapestPlanForQuota(needed);
    expect(result.listingsIncluded).toBeGreaterThanOrEqual(needed);
  });

  it("retourne le plus grand palier disponible si aucun ne couvre le besoin", () => {
    const huge = sorted[sorted.length - 1].listingsIncluded + 1000;
    expect(cheapestPlanForQuota(huge).key).toBe(sorted[sorted.length - 1].key);
  });
});
