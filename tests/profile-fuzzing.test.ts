/**
 * P2.9 (ROADMAP.md) — fuzzing de updateProfileAction (schéma zod) et
 * updateAvatarAction (champ `avatar` NON zod, gap signalé par le survol P2.9) :
 * champ requis manquant, chaîne surdimensionnée, structure imbriquée injectée,
 * valeur de type inattendu pour un champ fichier. Rejet générique attendu,
 * avant toute écriture.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: vi.fn(), findUnique: vi.fn() } },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/uploads", () => ({
  saveUploadedImage: vi.fn(),
  deleteUploadedImage: vi.fn(),
}));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { champsRequis: "Champs requis." },
    profil: { infosEnregistrees: "Enregistré.", photoErreur: "Photo refusée." },
  }),
}));

import { updateProfileAction, updateAvatarAction } from "@/actions/profile";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { saveUploadedImage } from "@/lib/uploads";

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  (requireUser as unknown as Mock).mockResolvedValue({ id: "u-1", phone: null });
});

describe("updateProfileAction — fuzzing (P2.9)", () => {
  it("rejette un nom manquant, sans écriture", async () => {
    const res = await updateProfileAction(undefined, fd({}));

    expect(res).toEqual({ error: "Champs requis." });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejette un nom démesurément long (> 100), sans écriture", async () => {
    const huge = "N".repeat(10_000);

    const res = await updateProfileAction(undefined, fd({ name: huge }));

    expect(res).toEqual({ error: "Champs requis." });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejette un téléphone malformé (structure imbriquée injectée en chaîne), sans écriture", async () => {
    const nested = JSON.stringify({ toString: "() => 1" });

    const res = await updateProfileAction(undefined, fd({ name: "Yassine", phone: nested }));

    expect(res).toEqual({ error: "Champs requis." });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe("updateAvatarAction — fuzzing d'un champ fichier NON zod (P2.9)", () => {
  it("rejette une valeur non-File pour le champ avatar (chaîne au lieu d'un fichier)", async () => {
    const f = new FormData();
    f.set("avatar", "pas-un-fichier");

    const res = await updateAvatarAction(undefined, f);

    expect(res).toEqual({ error: "Photo refusée." });
    expect(saveUploadedImage).not.toHaveBeenCalled();
  });

  it("rejette un File vide (taille 0)", async () => {
    const f = new FormData();
    f.set("avatar", new File([], "x.jpg", { type: "image/jpeg" }));

    const res = await updateAvatarAction(undefined, f);

    expect(res).toEqual({ error: "Photo refusée." });
    expect(saveUploadedImage).not.toHaveBeenCalled();
  });

  it("rejette une FormData sans champ avatar du tout", async () => {
    const res = await updateAvatarAction(undefined, new FormData());

    expect(res).toEqual({ error: "Photo refusée." });
    expect(saveUploadedImage).not.toHaveBeenCalled();
  });
});
