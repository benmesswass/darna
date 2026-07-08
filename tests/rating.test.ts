/**
 * §AHC7 (décision produit du 2026-07-08) — moyenne "affichée" d'une annonce,
 * mélangeant les vrais avis avec les entrées système "annulé par l'hôte"
 * (note automatique 1/5). Module pur partagé serveur/client.
 */
import { describe, expect, it } from "vitest";
import { blendedRatingStats, HOST_CANCELLATION_RATING } from "@/lib/rating";

describe("blendedRatingStats", () => {
  it("sans annulation : moyenne identique à la moyenne brute des avis", () => {
    const result = blendedRatingStats([{ rating: 5 }, { rating: 3 }], 0);
    expect(result.average).toBe(4);
    expect(result.total).toBe(2);
    expect(result.counts).toEqual([0, 0, 1, 0, 1]); // 1×3★, 1×5★
  });

  it("une annulation compte comme un vrai 1★ dans la moyenne", () => {
    const result = blendedRatingStats([{ rating: 5 }, { rating: 5 }], 1);
    // (5 + 5 + 1) / 3 = 3.666…
    expect(result.average).toBeCloseTo(11 / 3, 5);
    expect(result.total).toBe(3);
    expect(result.counts[HOST_CANCELLATION_RATING - 1]).toBe(1);
  });

  it("plusieurs annulations s'accumulent dans le bucket 1★", () => {
    const result = blendedRatingStats([{ rating: 4 }], 2);
    expect(result.counts).toEqual([2, 0, 0, 1, 0]);
    expect(result.total).toBe(3);
  });

  it("aucun avis mais une annulation : moyenne = 1.0, total = 1", () => {
    const result = blendedRatingStats([], 1);
    expect(result.average).toBe(1);
    expect(result.total).toBe(1);
  });

  it("rien du tout : moyenne 0, total 0 (état vide)", () => {
    const result = blendedRatingStats([], 0);
    expect(result.average).toBe(0);
    expect(result.total).toBe(0);
  });
});
