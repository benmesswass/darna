/**
 * P2.9 (ROADMAP.md) — fuzzing de saveSearchAction : champ requis manquant et
 * structure imbriquée injectée dans un champ scalaire (prixMin) doivent être
 * rejetés par zod avec un message générique fixe, avant toute écriture.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { savedSearch: { create: vi.fn() } },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/geo", () => ({ resolveCity: vi.fn().mockReturnValue("Hammamet") }));
vi.mock("@/lib/product-events", () => ({
  getAnonId: vi.fn().mockResolvedValue("anon-1"),
  logProductEvent: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { champsRequis: "Champs requis." },
    search: { alerteExisteDeja: "Alerte déjà existante.", alerteEnregistree: "Alerte enregistrée." },
  }),
}));

import { saveSearchAction } from "@/actions/saved-search";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  (requireUser as unknown as Mock).mockResolvedValue({ id: "u-1" });
});

describe("saveSearchAction — fuzzing (P2.9)", () => {
  it("rejette une ville manquante, sans écriture", async () => {
    const res = await saveSearchAction(undefined, fd({ ville: "" }));

    expect(res).toEqual({ error: "Champs requis." });
    expect(prisma.savedSearch.create).not.toHaveBeenCalled();
  });

  it("ne plante pas sur une ville démesurément longue (aucune limite zod dessus, mais aucun crash)", async () => {
    const huge = "H".repeat(100_000);

    const res = await saveSearchAction(undefined, fd({ ville: huge }));

    expect(res).toEqual({ success: "Alerte enregistrée." });
    expect(prisma.savedSearch.create).toHaveBeenCalledTimes(1);
  });

  it("rejette un prixMin non numérique (structure imbriquée injectée en chaîne), sans écriture", async () => {
    const nested = JSON.stringify({ $gt: 0, nested: { a: [1, 2, 3] } });

    const res = await saveSearchAction(undefined, fd({ ville: "Sousse", prixMin: nested }));

    expect(res).toEqual({ error: "Champs requis." });
    expect(prisma.savedSearch.create).not.toHaveBeenCalled();
  });
});
