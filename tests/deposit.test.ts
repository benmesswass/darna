/**
 * Tests — montant en ligne, modèle commission-only (LANCEMENT_ROADMAP.md
 * §L5.1) : le seul montant réglé en ligne est FIXE et vaut exactement les
 * frais de service Darna (`serviceFee`) — plus de plancher, plus de choix
 * voyageur (ancien `clampPayAmount`, supprimé).
 */
import { describe, expect, it } from "vitest";
import { computeDepositAmount } from "@/lib/config";

describe("computeDepositAmount", () => {
  it("vaut exactement les frais de service", () => {
    expect(computeDepositAmount(74)).toBe(74);
  });

  it("vaut 0 si les frais sont nuls (cas dégénéré)", () => {
    expect(computeDepositAmount(0)).toBe(0);
  });
});
