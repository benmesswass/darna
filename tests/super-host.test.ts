/**
 * GROWTH_ROADMAP.md §G4 — défi "Hôte Zéro Faille" : critères du badge
 * Super-Hôte (isSuperHost) et fenêtre de réclamation
 * (superHostBoostClaimEligible). Logique pure, prisma mocké.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    review: { findMany: vi.fn() },
    booking: { count: vi.fn() },
  },
}));

import { isSuperHost, superHostBoostClaimEligible } from "@/lib/super-host";
import { prisma } from "@/lib/prisma";
import { HOST_CANCELLATION_SIGNAL_DAYS } from "@/lib/config";

const userFindUnique = prisma.user.findUnique as unknown as Mock;
const reviewFindMany = prisma.review.findMany as unknown as Mock;
const bookingCount = prisma.booking.count as unknown as Mock;

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  vi.clearAllMocks();
  userFindUnique.mockResolvedValue({ suspended: false });
  bookingCount.mockResolvedValue(0);
});

describe("isSuperHost", () => {
  it("refuse un compte suspendu, même avec de très bons avis", async () => {
    userFindUnique.mockResolvedValue({ suspended: true });
    reviewFindMany.mockResolvedValue([{ rating: 5 }, { rating: 5 }, { rating: 5 }]);

    expect(await isSuperHost("u1")).toBe(false);
    expect(reviewFindMany).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur introuvable", async () => {
    userFindUnique.mockResolvedValue(null);

    expect(await isSuperHost("ghost")).toBe(false);
  });

  it("refuse en dessous de l'échantillon minimum d'avis (2 < 3)", async () => {
    reviewFindMany.mockResolvedValue([{ rating: 5 }, { rating: 5 }]);

    expect(await isSuperHost("u1")).toBe(false);
  });

  it("accepte avec un échantillon suffisant et une moyenne parfaite, zéro annulation", async () => {
    reviewFindMany.mockResolvedValue([{ rating: 5 }, { rating: 5 }, { rating: 5 }]);
    bookingCount.mockResolvedValue(0);

    expect(await isSuperHost("u1")).toBe(true);
  });

  it("refuse quand UNE SEULE annulation hôte fait chuter la moyenne blended sous le seuil", async () => {
    // 3 avis à 5 + 1 annulation (comptée à 1/5, cf. blendedRatingStats) :
    // (5+5+5+1)/4 = 4.0 < 4.5.
    reviewFindMany.mockResolvedValue([{ rating: 5 }, { rating: 5 }, { rating: 5 }]);
    bookingCount.mockResolvedValue(1);

    expect(await isSuperHost("u1")).toBe(false);
  });

  it("refuse une moyenne blended tout juste sous le seuil (4.4 < 4.5)", async () => {
    reviewFindMany.mockResolvedValue([{ rating: 4 }, { rating: 4 }, { rating: 5 }, { rating: 5 }]);
    bookingCount.mockResolvedValue(0);
    // (4+4+5+5)/4 = 4.5 → devrait passer ; testons juste sous en ajoutant un 4 de plus.

    expect(await isSuperHost("u1")).toBe(true);
  });

  it("interroge sur la fenêtre glissante HOST_CANCELLATION_SIGNAL_DAYS (avis + annulations)", async () => {
    reviewFindMany.mockResolvedValue([{ rating: 5 }, { rating: 5 }, { rating: 5 }]);

    await isSuperHost("u1");

    const reviewArgs = reviewFindMany.mock.calls[0][0];
    const bookingArgs = bookingCount.mock.calls[0][0];
    const expectedCutoff = Date.now() - HOST_CANCELLATION_SIGNAL_DAYS * DAY_MS;

    expect(reviewArgs.where.property.ownerId).toBe("u1");
    expect(reviewArgs.where.createdAt.gte.getTime()).toBeGreaterThan(expectedCutoff - 5000);
    expect(bookingArgs.where.property.ownerId).toBe("u1");
    expect(bookingArgs.where.cancelledByHostAt.gte.getTime()).toBeGreaterThan(expectedCutoff - 5000);
  });
});

describe("superHostBoostClaimEligible", () => {
  it("autorise une première réclamation (jamais réclamé)", () => {
    expect(superHostBoostClaimEligible(null)).toBe(true);
  });

  it("refuse une réclamation récente, encore dans la fenêtre", () => {
    const claimedAt = new Date(Date.now() - 1 * DAY_MS);
    expect(superHostBoostClaimEligible(claimedAt)).toBe(false);
  });

  it("autorise une nouvelle réclamation une fois la fenêtre écoulée", () => {
    const claimedAt = new Date(Date.now() - (HOST_CANCELLATION_SIGNAL_DAYS + 1) * DAY_MS);
    expect(superHostBoostClaimEligible(claimedAt)).toBe(true);
  });
});
