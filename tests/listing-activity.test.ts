/**
 * GROWTH_ROADMAP.md §G5 — signal de dynamique temps réel. Logique pure
 * (computeListingActivitySignal) : jamais de chiffre gonflé, masqué sous le
 * seuil (LISTING_ACTIVITY_MIN_VIEWS) ou trop ancien (LISTING_ACTIVITY_
 * RECENT_BOOKING_DAYS).
 */
import { describe, expect, it } from "vitest";
import { computeListingActivitySignal } from "@/lib/listing-activity";
import {
  LISTING_ACTIVITY_MIN_VIEWS,
  LISTING_ACTIVITY_RECENT_BOOKING_DAYS,
} from "@/lib/config";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("computeListingActivitySignal — vues", () => {
  it("masque le compteur de vues sous le seuil", () => {
    const result = computeListingActivitySignal({
      viewCount: LISTING_ACTIVITY_MIN_VIEWS - 1,
      lastBookedAt: null,
    });
    expect(result.viewCount).toBeNull();
  });

  it("affiche le compteur de vues au seuil exact", () => {
    const result = computeListingActivitySignal({
      viewCount: LISTING_ACTIVITY_MIN_VIEWS,
      lastBookedAt: null,
    });
    expect(result.viewCount).toBe(LISTING_ACTIVITY_MIN_VIEWS);
  });

  it("affiche le compteur de vues au-delà du seuil", () => {
    const result = computeListingActivitySignal({
      viewCount: LISTING_ACTIVITY_MIN_VIEWS + 50,
      lastBookedAt: null,
    });
    expect(result.viewCount).toBe(LISTING_ACTIVITY_MIN_VIEWS + 50);
  });
});

describe("computeListingActivitySignal — dernière réservation", () => {
  it("masque le signal quand il n'y a jamais eu de réservation", () => {
    const result = computeListingActivitySignal({ viewCount: 0, lastBookedAt: null });
    expect(result.lastBookedDaysAgo).toBeNull();
  });

  it("affiche le nombre de jours pour une réservation récente", () => {
    const lastBookedAt = new Date(Date.now() - 5 * DAY_MS);
    const result = computeListingActivitySignal({ viewCount: 0, lastBookedAt });
    expect(result.lastBookedDaysAgo).toBe(5);
  });

  it("affiche encore le signal pile à la limite du seuil", () => {
    const lastBookedAt = new Date(Date.now() - LISTING_ACTIVITY_RECENT_BOOKING_DAYS * DAY_MS);
    const result = computeListingActivitySignal({ viewCount: 0, lastBookedAt });
    expect(result.lastBookedDaysAgo).toBe(LISTING_ACTIVITY_RECENT_BOOKING_DAYS);
  });

  it("masque une réservation trop ancienne (jamais un faux signal de fraîcheur)", () => {
    const lastBookedAt = new Date(
      Date.now() - (LISTING_ACTIVITY_RECENT_BOOKING_DAYS + 1) * DAY_MS
    );
    const result = computeListingActivitySignal({ viewCount: 0, lastBookedAt });
    expect(result.lastBookedDaysAgo).toBeNull();
  });
});
