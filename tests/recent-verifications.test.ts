/**
 * G10 (GROWTH_ROADMAP.md) — mur de la confiance en direct de l'accueil.
 * Prouve que `getRecentVerifications` ne lit et n'expose que des données non
 * personnelles (ville + date), reste scopée aux annonces actives vérifiées,
 * et respecte le tri/`take` demandés.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { property: { findMany: vi.fn() } },
}));

import { getRecentVerifications } from "@/lib/listings";
import { prisma } from "@/lib/prisma";

const findMany = prisma.property.findMany as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  findMany.mockResolvedValue([]);
});

describe("getRecentVerifications — mur de la confiance en direct (G10)", () => {
  it("ne sélectionne que id/ville/date — jamais de donnée personnelle (propriétaire, Wakil, titre)", async () => {
    await getRecentVerifications();

    const arg = findMany.mock.calls[0][0];
    expect(arg.select).toEqual({ id: true, city: true, verifiedAt: true });
    expect(arg.include).toBeUndefined();
  });

  it("ne cible que les annonces ACTIVE et vérifiées", async () => {
    await getRecentVerifications();

    const where = findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ status: "ACTIVE", verified: true });
  });

  it("trie par date de vérification la plus récente", async () => {
    await getRecentVerifications();

    expect(findMany.mock.calls[0][0].orderBy).toEqual({ verifiedAt: "desc" });
  });

  it("prend 5 par défaut, ou le nombre demandé", async () => {
    await getRecentVerifications();
    expect(findMany.mock.calls[0][0].take).toBe(5);

    await getRecentVerifications(3);
    expect(findMany.mock.calls[1][0].take).toBe(3);
  });
});
