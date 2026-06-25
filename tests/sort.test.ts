import { describe, expect, it } from "vitest";
import { parseSortKey, SEARCH_SORTS } from "@/lib/constants";

describe("parseSortKey", () => {
  it("accepte chaque clé de tri valide", () => {
    for (const key of SEARCH_SORTS) {
      expect(parseSortKey(key)).toBe(key);
    }
  });

  it("retombe sur 'recommande' pour une valeur absente ou invalide", () => {
    expect(parseSortKey(undefined)).toBe("recommande");
    expect(parseSortKey("")).toBe("recommande");
    expect(parseSortKey("n-importe-quoi")).toBe("recommande");
    // Pas d'injection : une valeur arbitraire ne devient jamais un orderBy.
    expect(parseSortKey("price; DROP TABLE")).toBe("recommande");
  });
});
