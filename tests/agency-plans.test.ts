import { describe, expect, it } from "vitest";

import { AGENCY_PLANS, SUBSCRIPTION_STATUSES } from "@/lib/constants";

// AGENCY_PLANS est le référentiel des paliers Subscription.plan
// (MONETISATION_IMMO_ROADMAP.md §MI1) — ces tests verrouillent sa forme
// (clés uniques, valeurs positives), pas le prix lui-même (PROVISOIRE,
// à réviser dès validation business).

describe("AGENCY_PLANS", () => {
  it("a des clés uniques", () => {
    const keys = AGENCY_PLANS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("a un prix et un quota d'annonces strictement positifs pour chaque palier", () => {
    for (const plan of AGENCY_PLANS) {
      expect(plan.priceTND).toBeGreaterThan(0);
      expect(plan.listingsIncluded).toBeGreaterThan(0);
    }
  });

  it("seul le palier Pro inclut un boost « à la une » offert par cycle (MI4)", () => {
    const withBoost = AGENCY_PLANS.filter((p) => p.freeBoostPerCycle).map((p) => p.key);
    expect(withBoost).toEqual(["PRO"]);
  });
});

describe("SUBSCRIPTION_STATUSES", () => {
  it("ne stocke pas de statut dérivé (EXPIRE)", () => {
    expect(SUBSCRIPTION_STATUSES).toEqual(["EN_ATTENTE", "ACTIF"]);
  });
});
