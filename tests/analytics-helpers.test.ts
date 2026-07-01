/**
 * Tests — helpers purs du tableau de bord founder.
 * parsePeriod : borne la fenêtre temporelle reçue de l'URL (défaut 30, "all" = null).
 * isValidCountry : garde le pays d'inscription au référentiel (anti-injection libellé).
 */
import { describe, expect, it } from "vitest";

import { parsePeriod, PERIOD_OPTIONS } from "@/lib/analytics";
import { isValidCountry, COUNTRY_LABELS, DEFAULT_COUNTRY } from "@/lib/constants";

describe("parsePeriod", () => {
  it("accepte les fenêtres valides 7 / 30 / 90", () => {
    expect(parsePeriod("7")).toBe(7);
    expect(parsePeriod("30")).toBe(30);
    expect(parsePeriod("90")).toBe(90);
  });

  it("\"all\" → null (cumulatif depuis l'origine)", () => {
    expect(parsePeriod("all")).toBeNull();
  });

  it("valeur absente ou invalide → défaut 30", () => {
    expect(parsePeriod(undefined)).toBe(30);
    expect(parsePeriod("")).toBe(30);
    expect(parsePeriod("999")).toBe(30);
    expect(parsePeriod("abc")).toBe(30);
  });

  it("toute valeur renvoyée appartient au référentiel PERIOD_OPTIONS", () => {
    for (const raw of ["7", "30", "90", "all", "x"]) {
      expect(PERIOD_OPTIONS).toContain(parsePeriod(raw));
    }
  });
});

describe("isValidCountry", () => {
  it("accepte un libellé du référentiel", () => {
    expect(isValidCountry(DEFAULT_COUNTRY)).toBe(true);
    expect(isValidCountry("France")).toBe(true);
  });

  it("refuse un libellé hors référentiel (anti-injection)", () => {
    expect(isValidCountry("Atlantide")).toBe(false);
    expect(isValidCountry("")).toBe(false);
    expect(isValidCountry("<script>")).toBe(false);
  });

  it("tous les libellés du référentiel sont valides", () => {
    for (const c of COUNTRY_LABELS) expect(isValidCountry(c)).toBe(true);
  });
});
