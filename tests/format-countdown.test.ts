import { describe, expect, it } from "vitest";
import { formatCountdown } from "@/lib/format";

describe("formatCountdown", () => {
  it("formate en mm:ss à deux chiffres", () => {
    expect(formatCountdown(15 * 60 * 1000)).toBe("15:00");
    expect(formatCountdown(2 * 60 * 1000 + 5 * 1000)).toBe("02:05");
    expect(formatCountdown(9 * 1000)).toBe("00:09");
  });

  it("borne à zéro (jamais de négatif)", () => {
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(-5000)).toBe("00:00");
  });

  it("tronque les millisecondes vers le bas (pas d'arrondi prématuré)", () => {
    // 59,9 s restantes ⇒ on affiche encore 00:59, pas 01:00.
    expect(formatCountdown(59_900)).toBe("00:59");
  });
});
