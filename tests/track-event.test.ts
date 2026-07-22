/**
 * Tests — src/actions/track-event.ts (INSTRUMENTATION_ROADMAP.md §IN2).
 * Point d'entrée public pour les événements produit purement client
 * (partage, carte) : zéro confiance au client sur userId/anonId, catalogue
 * restreint (impossible de forger un événement server-only), rate-limité.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { productEvent: { create: vi.fn() } },
}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
  clientIp: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { trackEvent } from "@/actions/track-event";

function mockCookies(anonId: string | null) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === "darna-vid" && anonId ? { value: anonId } : undefined),
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCookies("anon-1");
  vi.mocked(getSessionUser).mockResolvedValue(null);
  vi.mocked(rateLimit).mockResolvedValue(true);
  vi.mocked(clientIp).mockResolvedValue("1.2.3.4");
});

describe("trackEvent", () => {
  it("écrit un événement client valide (SHARE_CLICKED)", async () => {
    await trackEvent({ event: "SHARE_CLICKED", metadata: { channel: "copy" } });

    expect(prisma.productEvent.create).toHaveBeenCalledWith({
      data: {
        event: "SHARE_CLICKED",
        userId: null,
        anonId: "anon-1",
        metadata: JSON.stringify({ channel: "copy" }),
      },
    });
  });

  it("résout userId depuis la session si connecté", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({ id: "user-1" } as never);

    await trackEvent({ event: "MAP_INTERACTED", metadata: { markerCount: 3 } });

    expect(prisma.productEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user-1" }) })
    );
  });

  it("rejette un événement hors catalogue client (impossible de forger BOOKING_STARTED)", async () => {
    await trackEvent({ event: "BOOKING_STARTED", metadata: {} });

    expect(prisma.productEvent.create).not.toHaveBeenCalled();
  });

  it("rejette une entrée totalement invalide", async () => {
    await trackEvent("n'importe quoi");

    expect(prisma.productEvent.create).not.toHaveBeenCalled();
  });

  it("rejette une metadata surdimensionnée", async () => {
    await trackEvent({ event: "SHARE_CLICKED", metadata: { big: "x".repeat(3000) } });

    expect(prisma.productEvent.create).not.toHaveBeenCalled();
  });

  it("respecte le rate limit (clé anonId)", async () => {
    vi.mocked(rateLimit).mockResolvedValue(false);

    await trackEvent({ event: "SHARE_CLICKED", metadata: {} });

    expect(rateLimit).toHaveBeenCalledWith("track-event", "anon-1");
    expect(prisma.productEvent.create).not.toHaveBeenCalled();
  });

  it("retombe sur l'IP pour la clé de rate limit si anonId absent", async () => {
    mockCookies(null);

    await trackEvent({ event: "SHARE_CLICKED", metadata: {} });

    expect(rateLimit).toHaveBeenCalledWith("track-event", "1.2.3.4");
  });
});
