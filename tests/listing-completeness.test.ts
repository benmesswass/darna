/**
 * GROWTH_ROADMAP.md §G2 — score de complétude d'annonce, dérivé (jamais
 * stocké) de 3 critères existants sur Property.
 */
import { describe, expect, it } from "vitest";
import { computeListingCompleteness } from "@/lib/listing-completeness";
import {
  COMPLETENESS_MIN_AMENITIES,
  COMPLETENESS_MIN_DESCRIPTION_LENGTH,
  COMPLETENESS_MIN_PHOTOS,
} from "@/lib/config";

const LONG_DESCRIPTION = "x".repeat(COMPLETENESS_MIN_DESCRIPTION_LENGTH);
const SHORT_DESCRIPTION = "x".repeat(COMPLETENESS_MIN_DESCRIPTION_LENGTH - 1);
const ENOUGH_AMENITIES = Array.from({ length: COMPLETENESS_MIN_AMENITIES }, (_, i) => `am${i}`).join(
  "|"
);

describe("computeListingCompleteness", () => {
  it("score 3/3 quand les 3 critères sont remplis", () => {
    const result = computeListingCompleteness({
      photoCount: COMPLETENESS_MIN_PHOTOS,
      description: LONG_DESCRIPTION,
      amenities: ENOUGH_AMENITIES,
    });

    expect(result).toEqual({
      score: 3,
      total: 3,
      photosOk: true,
      descriptionOk: true,
      amenitiesOk: true,
    });
  });

  it("score 0/3 sur une annonce minimale (1 photo, description/équipements courts)", () => {
    const result = computeListingCompleteness({
      photoCount: 1,
      description: SHORT_DESCRIPTION,
      amenities: "",
    });

    expect(result.score).toBe(0);
    expect(result.photosOk).toBe(false);
    expect(result.descriptionOk).toBe(false);
    expect(result.amenitiesOk).toBe(false);
  });

  it("compte les photos strictement en dessous du seuil comme incomplet", () => {
    const result = computeListingCompleteness({
      photoCount: COMPLETENESS_MIN_PHOTOS - 1,
      description: LONG_DESCRIPTION,
      amenities: ENOUGH_AMENITIES,
    });

    expect(result.photosOk).toBe(false);
    expect(result.score).toBe(2);
  });

  it("compte la description strictement en dessous du seuil comme incomplète", () => {
    const result = computeListingCompleteness({
      photoCount: COMPLETENESS_MIN_PHOTOS,
      description: SHORT_DESCRIPTION,
      amenities: ENOUGH_AMENITIES,
    });

    expect(result.descriptionOk).toBe(false);
    expect(result.score).toBe(2);
  });

  it("ignore les segments vides du champ amenities (séparateur « | »)", () => {
    const result = computeListingCompleteness({
      photoCount: COMPLETENESS_MIN_PHOTOS,
      description: LONG_DESCRIPTION,
      amenities: "wifi||piscine| |", // 2 segments réels seulement
    });

    expect(result.amenitiesOk).toBe(false);
    expect(result.score).toBe(2);
  });

  it("ne compte les équipements que si l'échantillon atteint le seuil exact", () => {
    const result = computeListingCompleteness({
      photoCount: COMPLETENESS_MIN_PHOTOS,
      description: LONG_DESCRIPTION,
      amenities: ENOUGH_AMENITIES,
    });

    expect(result.amenitiesOk).toBe(true);
  });
});
