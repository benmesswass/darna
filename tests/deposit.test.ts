/**
 * Tests — montant en ligne, modèle commission-only (LANCEMENT_ROADMAP.md
 * §L5.1) : le seul montant réglé en ligne est les frais de service Darna
 * RESTANTS (après réduction/crédit éventuels) — plus de choix voyageur
 * (ancien `clampPayAmount`, supprimé). Peut valoir 0 si un crédit couvre
 * tout — cf. tests/booking-credit-application.test.ts pour le cas réel, et
 * startKonnectPaymentAction pour la confirmation directe sans Konnect.
 */
import { describe, expect, it } from "vitest";
import { computeDepositAmount } from "@/lib/config";

describe("computeDepositAmount", () => {
  it("vaut exactement les frais de service quand rien ne les réduit", () => {
    expect(computeDepositAmount(74)).toBe(74);
  });

  it("vaut 0 si les frais sont nuls (couverts par un crédit, ou d'origine)", () => {
    expect(computeDepositAmount(0)).toBe(0);
  });

  it("arrondit au TND le plus proche", () => {
    expect(computeDepositAmount(0.4)).toBe(0);
    expect(computeDepositAmount(0.6)).toBe(1);
  });
});
