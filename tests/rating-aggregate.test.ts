import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    review: { aggregate: vi.fn() },
    property: { update: vi.fn() },
  },
}));
// listings.ts importe session/product-events (§IN1, SEARCH_PERFORMED) — mocké
// ici pour ne jamais charger next-auth pour de vrai dans ce test, sans rapport.
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/product-events", () => ({ getAnonId: vi.fn(), logProductEvent: vi.fn() }));

import { recomputePropertyRating } from "@/lib/listings";
import { prisma } from "@/lib/prisma";

const aggregate = prisma.review.aggregate as unknown as Mock;
const update = prisma.property.update as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  update.mockResolvedValue({});
});

describe("recomputePropertyRating", () => {
  it("persiste la moyenne et le nombre quand il y a des avis", async () => {
    aggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: { rating: 8 } });

    await recomputePropertyRating("p1");

    expect(update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { ratingAvg: 4.5, ratingCount: 8 },
    });
  });

  it("met ratingAvg à null quand il n'y a aucun avis (relégué en fin de tri)", async () => {
    aggregate.mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } });

    await recomputePropertyRating("p2");

    expect(update).toHaveBeenCalledWith({
      where: { id: "p2" },
      data: { ratingAvg: null, ratingCount: 0 },
    });
  });
});
