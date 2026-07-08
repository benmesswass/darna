/**
 * Phase 2 — i18n : parité des clés fr / en / ar + direction RTL.
 *
 * Site trilingue (CLAUDE.md) : toute clé doit exister dans LES TROIS
 * dictionnaires, sinon un composant affiche une clé brute ou plante en arabe.
 * Ce test compare la STRUCTURE (chemins de clés) des trois dictionnaires — il
 * rougit dès qu'une traduction est oubliée dans en.ts ou ar.ts.
 */
import { describe, expect, it } from "vitest";
import { fr } from "@/lib/i18n/fr";
import { en } from "@/lib/i18n/en";
import { ar } from "@/lib/i18n/ar";
import { getDirection, getDictionary } from "@/lib/i18n";

/** Collecte récursive des chemins de clés (les fonctions sont des feuilles). */
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return typeof v === "object" && v !== null ? keyPaths(v, path) : [path];
  });
}

describe("i18n — parité des dictionnaires", () => {
  const frKeys = keyPaths(fr).sort();

  it("en.ts a exactement les mêmes clés que fr.ts (référence)", () => {
    expect(keyPaths(en).sort()).toEqual(frKeys);
  });

  it("ar.ts a exactement les mêmes clés que fr.ts (référence)", () => {
    expect(keyPaths(ar).sort()).toEqual(frKeys);
  });

  it("aucune valeur vide dans les feuilles chaîne des trois dictionnaires", () => {
    for (const [name, dict] of [["fr", fr], ["en", en], ["ar", ar]] as const) {
      const emptyLeaf = (obj: unknown): boolean =>
        typeof obj === "string"
          ? obj.trim() === ""
          : typeof obj === "object" && obj !== null
            ? Object.values(obj as Record<string, unknown>).some(emptyLeaf)
            : false;
      expect(emptyLeaf(dict), `${name} contient une chaîne vide`).toBe(false);
    }
  });
});

describe("i18n — direction & résolution", () => {
  it("l'arabe est en RTL, fr/en en LTR", () => {
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("fr")).toBe("ltr");
    expect(getDirection("en")).toBe("ltr");
  });

  it("getDictionary renvoie le bon dictionnaire par locale", () => {
    expect(getDictionary("fr")).toBe(fr);
    expect(getDictionary("en")).toBe(en);
    expect(getDictionary("ar")).toBe(ar);
  });
});
