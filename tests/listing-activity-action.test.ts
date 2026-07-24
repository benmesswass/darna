/**
 * Tests — src/actions/listing-activity.ts (GROWTH_ROADMAP.md §G5).
 * L'incrément de Property.viewCount est protégé par la contrainte unique
 * PropertyView(propertyId, anonId) : anti-inflation, jamais un chiffre
 * gonflé même par un visiteur qui rafraîchit la page ou un script.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    propertyView: { create: vi.fn() },
    property: { update: vi.fn() },
  },
}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(), clientIp: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { recordListingViewAction } from "@/actions/listing-activity";

function mockCookies(anonId: string | null) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === "darna-vid" && anonId ? { value: anonId } : undefined),
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCookies("anon-1");
  vi.mocked(rateLimit).mockResolvedValue(true);
  vi.mocked(prisma.property.update).mockResolvedValue({} as never);
});

describe("recordListingViewAction", () => {
  it("incrémente viewCount à la 1ère vue d'un visiteur", async () => {
    vi.mocked(prisma.propertyView.create).mockResolvedValue({} as never);

    await recordListingViewAction("prop-1");

    expect(prisma.propertyView.create).toHaveBeenCalledWith({
      data: { propertyId: "prop-1", anonId: "anon-1" },
    });
    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: "prop-1" },
      data: { viewCount: { increment: 1 } },
    });
  });

  it("n'incrémente pas une 2e fois pour le même visiteur (contrainte unique)", async () => {
    vi.mocked(prisma.propertyView.create).mockRejectedValue(new Error("Unique constraint failed"));

    await recordListingViewAction("prop-1");

    expect(prisma.property.update).not.toHaveBeenCalled();
  });

  it("n'écrit rien sans cookie visiteur (dédup impossible à garantir)", async () => {
    mockCookies(null);

    await recordListingViewAction("prop-1");

    expect(rateLimit).not.toHaveBeenCalled();
    expect(prisma.propertyView.create).not.toHaveBeenCalled();
    expect(prisma.property.update).not.toHaveBeenCalled();
  });

  it("respecte le rate limit (clé anonId)", async () => {
    vi.mocked(rateLimit).mockResolvedValue(false);

    await recordListingViewAction("prop-1");

    expect(rateLimit).toHaveBeenCalledWith("listing-view", "anon-1");
    expect(prisma.propertyView.create).not.toHaveBeenCalled();
  });

  it("rejette un propertyId invalide", async () => {
    await recordListingViewAction("");

    expect(prisma.propertyView.create).not.toHaveBeenCalled();
  });
});
