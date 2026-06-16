import { describe, expect, it } from "vitest";

import { tndToMillimes } from "@/lib/konnect";

// Le montant débité par Konnect est TOUJOURS en millimes (1 TND = 1000 millimes).
// Une erreur ici facturerait l'acheteur ×1000 ou ÷1000 → test de non-régression.
describe("tndToMillimes", () => {
  it("convertit les dinars en millimes (×1000)", () => {
    expect(tndToMillimes(1)).toBe(1000);
    expect(tndToMillimes(120)).toBe(120_000);
  });

  it("arrondit au millime le plus proche", () => {
    expect(tndToMillimes(1.2345)).toBe(1235);
    expect(tndToMillimes(0.0004)).toBe(0);
  });

  it("gère le montant nul", () => {
    expect(tndToMillimes(0)).toBe(0);
  });
});
