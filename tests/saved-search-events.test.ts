/**
 * Tests — SAVED_SEARCH_CREATED dans saveSearchAction
 * (INSTRUMENTATION_ROADMAP.md §IN2). Ne re-teste pas toute la validation
 * pré-existante de saveSearchAction, seulement l'ajout : l'événement produit
 * s'écrit après une création réussie, jamais sur un échec.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { savedSearch: { create: vi.fn() } },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/geo", () => ({ resolveCity: vi.fn() }));
vi.mock("@/lib/product-events", () => ({ logProductEvent: vi.fn(), getAnonId: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { champsRequis: "Champs requis" },
    search: {
      alerteExisteDeja: "Alerte déjà existante",
      alerteEnregistree: "Alerte enregistrée",
    },
  }),
}));

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { resolveCity } from "@/lib/geo";
import { logProductEvent, getAnonId } from "@/lib/product-events";
import { saveSearchAction } from "@/actions/saved-search";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue({ id: "user-1" } as never);
  vi.mocked(resolveCity).mockReturnValue("Hammamet");
  vi.mocked(getAnonId).mockResolvedValue("anon-1");
});

describe("saveSearchAction — instrumentation §IN2", () => {
  it("écrit SAVED_SEARCH_CREATED après une création réussie", async () => {
    vi.mocked(prisma.savedSearch.create).mockResolvedValue({} as never);

    await saveSearchAction(undefined, fd({ ville: "hammamet", prixMin: "100", prixMax: "300" }));

    expect(logProductEvent).toHaveBeenCalledWith({
      event: "SAVED_SEARCH_CREATED",
      userId: "user-1",
      anonId: "anon-1",
      metadata: { city: "Hammamet", prixMin: 100, prixMax: 300 },
    });
  });

  it("ne log rien si la création échoue (alerte déjà existante)", async () => {
    vi.mocked(prisma.savedSearch.create).mockRejectedValue({ code: "P2002" });

    await saveSearchAction(undefined, fd({ ville: "hammamet" }));

    expect(logProductEvent).not.toHaveBeenCalled();
  });

  it("ne log rien si la validation échoue (ville non résolue)", async () => {
    vi.mocked(resolveCity).mockReturnValue(null);

    await saveSearchAction(undefined, fd({ ville: "villeinconnue" }));

    expect(prisma.savedSearch.create).not.toHaveBeenCalled();
    expect(logProductEvent).not.toHaveBeenCalled();
  });
});
