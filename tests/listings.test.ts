/**
 * Tests — src/lib/listings.ts, instrumentation SEARCH_PERFORMED
 * (INSTRUMENTATION_ROADMAP.md §IN1). `searchSejours` doit écrire un événement
 * produit à chaque recherche, y compris `resultCount: 0` (ville inconnue).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));
vi.mock("@/lib/product-events", () => ({
  logProductEvent: vi.fn(),
  getAnonId: vi.fn(),
}));
vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(),
}));

import { searchSejours } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { logProductEvent, getAnonId } from "@/lib/product-events";
import { getSessionUser } from "@/lib/session";

const findMany = prisma.property.findMany as unknown as Mock;
const count = prisma.property.count as unknown as Mock;
const logEvent = logProductEvent as unknown as Mock;
const anonId = getAnonId as unknown as Mock;
const sessionUser = getSessionUser as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  anonId.mockResolvedValue("anon-1");
  sessionUser.mockResolvedValue(null);
});

describe("searchSejours — SEARCH_PERFORMED (§IN1)", () => {
  it("écrit resultCount: 0 pour une ville inconnue, sans interroger la DB", async () => {
    await searchSejours({ ville: "Zzzznotacity999XYZ" });

    expect(findMany).not.toHaveBeenCalled();
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "SEARCH_PERFORMED",
        userId: null,
        anonId: "anon-1",
        metadata: expect.objectContaining({
          ville: "Zzzznotacity999XYZ",
          resolvedCity: null,
          resultCount: 0,
        }),
      })
    );
  });

  it("écrit le vrai resultCount pour une recherche avec résultats", async () => {
    findMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }]);
    count.mockResolvedValue(2);

    await searchSejours({ ville: "Hammamet", prixMax: "300" });

    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "SEARCH_PERFORMED",
        metadata: expect.objectContaining({
          ville: "Hammamet",
          resolvedCity: "Hammamet",
          prixMax: "300",
          resultCount: 2,
        }),
      })
    );
  });

  it("associe l'utilisateur connecté quand une session existe", async () => {
    findMany.mockResolvedValue([{ id: "p1" }]);
    count.mockResolvedValue(1);
    sessionUser.mockResolvedValue({ id: "user-1" });

    await searchSejours({ ville: "Hammamet" });

    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", anonId: "anon-1" })
    );
  });
});
