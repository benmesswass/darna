/**
 * Tests — acompte minimum + clamp serveur du montant choisi.
 * Invariants : depositAmount = max(ceil(10% du total), commission), ≤ total ;
 * le montant choisi est TOUJOURS reborné dans [depositAmount, totalPrice].
 */
import { describe, expect, it } from "vitest";
import {
  computeDepositAmount,
  clampPayAmount,
  DEPOSIT_MIN_RATE,
} from "@/lib/config";

describe("computeDepositAmount", () => {
  it("vaut 10% du total quand la commission est plus faible", () => {
    // total 1000, commission 74 → 10% = 100 > 74
    expect(computeDepositAmount(1000, 74)).toBe(100);
  });

  it("remonte à la commission quand 10% serait insuffisant (revenu garanti)", () => {
    // total 500, commission 80 → 10% = 50 < 80 → acompte = 80
    expect(computeDepositAmount(500, 80)).toBe(80);
  });

  it("arrondit 10% au supérieur", () => {
    expect(computeDepositAmount(1005, 1)).toBe(Math.ceil(1005 * DEPOSIT_MIN_RATE));
  });

  it("ne dépasse jamais le total (petits montants)", () => {
    // total 5, commission 50 → borné au total
    expect(computeDepositAmount(5, 50)).toBe(5);
  });
});

describe("clampPayAmount", () => {
  const deposit = 100;
  const total = 1000;

  it("remonte un montant sous l'acompte au minimum", () => {
    expect(clampPayAmount(10, deposit, total)).toBe(deposit);
  });

  it("ramène un montant au-dessus du total au total", () => {
    expect(clampPayAmount(99999, deposit, total)).toBe(total);
  });

  it("conserve un montant intermédiaire valide (arrondi)", () => {
    expect(clampPayAmount(500.4, deposit, total)).toBe(500);
  });

  it("retombe sur l'acompte pour une valeur non finie (NaN, Infinity)", () => {
    expect(clampPayAmount(Number.NaN, deposit, total)).toBe(deposit);
    expect(clampPayAmount(Infinity, deposit, total)).toBe(deposit);
  });
});
