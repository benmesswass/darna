/**
 * Tests — src/lib/product-events.ts (INSTRUMENTATION_ROADMAP.md §IN0).
 * logProductEvent doit suivre exactement le contrat de logAudit : écriture
 * async, jamais d'exception remontée à l'appelant même si la DB échoue.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { productEvent: { create: vi.fn() } },
}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getAnonId, logProductEvent } from "@/lib/product-events";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("logProductEvent", () => {
  it("écrit l'événement avec anonId/userId/metadata sérialisée", async () => {
    await logProductEvent({
      event: "LISTING_VIEWED",
      userId: "user1",
      anonId: "anon1",
      metadata: { propertyId: "p1", vertical: "STAY" },
    });

    expect(prisma.productEvent.create).toHaveBeenCalledWith({
      data: {
        event: "LISTING_VIEWED",
        userId: "user1",
        anonId: "anon1",
        metadata: JSON.stringify({ propertyId: "p1", vertical: "STAY" }),
      },
    });
  });

  it("normalise userId/anonId/metadata absents", async () => {
    await logProductEvent({ event: "LISTING_VIEWED" });

    expect(prisma.productEvent.create).toHaveBeenCalledWith({
      data: {
        event: "LISTING_VIEWED",
        userId: null,
        anonId: null,
        metadata: "{}",
      },
    });
  });

  it("ne lève jamais si l'écriture échoue (silencieux, comme logAudit)", async () => {
    vi.mocked(prisma.productEvent.create).mockRejectedValueOnce(new Error("DB down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(logProductEvent({ event: "LISTING_VIEWED" })).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});

describe("getAnonId", () => {
  it("lit la valeur du cookie darna-vid", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) => (name === "darna-vid" ? { value: "abc-123" } : undefined),
    } as never);

    expect(await getAnonId()).toBe("abc-123");
  });

  it("retourne null si le cookie est absent", async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never);

    expect(await getAnonId()).toBeNull();
  });
});
