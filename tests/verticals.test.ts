import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TYPES_BY_VERTICAL,
  VERTICALS,
  verticalOfType,
} from "@/lib/constants";
import { immoEnabled, stayEnabled, verticalEnabled } from "@/lib/modes";

// Le concept `vertical` est la frontière de module + de feature-flag : il ne
// doit JAMAIS diverger du `type` d'annonce. Ces tests verrouillent le mapping
// et la sémantique « activé par défaut, désactivé seulement par "false" ».

describe("verticalOfType", () => {
  it("mappe SEJOUR → STAY", () => expect(verticalOfType("SEJOUR")).toBe("STAY"));
  it("mappe LOCATION → IMMO", () =>
    expect(verticalOfType("LOCATION")).toBe("IMMO"));
  it("mappe VENTE → IMMO", () => expect(verticalOfType("VENTE")).toBe("IMMO"));
});

describe("TYPES_BY_VERTICAL", () => {
  it("regroupe exactement les types par verticale", () => {
    expect(VERTICALS).toEqual(["STAY", "IMMO"]);
    expect(TYPES_BY_VERTICAL.STAY).toEqual(["SEJOUR"]);
    expect(TYPES_BY_VERTICAL.IMMO).toEqual(["LOCATION", "VENTE"]);
  });

  it("est cohérent avec verticalOfType (aucune divergence)", () => {
    for (const v of VERTICALS) {
      for (const t of TYPES_BY_VERTICAL[v]) {
        expect(verticalOfType(t)).toBe(v);
      }
    }
  });
});

describe("feature flags de verticale", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("active les deux verticales par défaut (aucune config) — démo complète", () => {
    vi.stubEnv("STAY_ENABLED", undefined);
    vi.stubEnv("IMMO_ENABLED", undefined);
    expect(stayEnabled()).toBe(true);
    expect(immoEnabled()).toBe(true);
  });

  it("ne désactive que sur la valeur explicite \"false\"", () => {
    vi.stubEnv("STAY_ENABLED", "false");
    expect(stayEnabled()).toBe(false);
    vi.stubEnv("STAY_ENABLED", "true");
    expect(stayEnabled()).toBe(true);
    // Une valeur inattendue ne désactive pas (sécurité par défaut = activé).
    vi.stubEnv("STAY_ENABLED", "1");
    expect(stayEnabled()).toBe(true);
  });

  it("verticalEnabled aiguille vers le bon flag", () => {
    vi.stubEnv("STAY_ENABLED", "false");
    vi.stubEnv("IMMO_ENABLED", "true");
    expect(verticalEnabled("STAY")).toBe(false);
    expect(verticalEnabled("IMMO")).toBe(true);
  });
});
