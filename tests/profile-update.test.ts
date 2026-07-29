/**
 * P2.10 (ROADMAP.md) — updateProfileAction / updateAvatarAction /
 * removeAvatarAction (src/actions/profile.ts) n'avaient aucune couverture
 * Vitest (seule changePasswordAction l'était, cf. profile-password.test.ts).
 * deleteAccountAction (flux RGPD) est déjà couvert séparément par
 * tests/delete-account-action.test.ts — hors scope ici.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/lib/uploads", () => ({
  saveUploadedImage: vi.fn(),
  deleteUploadedImage: vi.fn(),
}));

vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { champsRequis: "Champs requis.", tropDeTentatives: "Trop de tentatives." },
    profil: {
      infosEnregistrees: "Vos informations ont été mises à jour.",
      photoEnregistree: "Photo de profil mise à jour.",
      photoSupprimee: "Photo de profil supprimée.",
      photoErreur: "Erreur photo.",
    },
  }),
}));

import {
  updateProfileAction,
  updateAvatarAction,
  removeAvatarAction,
} from "@/actions/profile";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { saveUploadedImage, deleteUploadedImage } from "@/lib/uploads";
import { assertRateLimit } from "@/lib/rate-limit";

const mockRequireUser = requireUser as unknown as Mock;
const mockFindUnique = prisma.user.findUnique as unknown as Mock;
const mockUpdate = prisma.user.update as unknown as Mock;

function profileFd(name: string, phone = ""): FormData {
  const fd = new FormData();
  fd.set("name", name);
  fd.set("phone", phone);
  return fd;
}

function avatarFd(file: File | null): FormData {
  const fd = new FormData();
  if (file) fd.set("avatar", file);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.auditLog.create as unknown as Mock).mockResolvedValue({});
  mockRequireUser.mockResolvedValue({ id: "u1", phone: "+21611111111" });
  mockUpdate.mockResolvedValue({});
  (assertRateLimit as unknown as Mock).mockResolvedValue(true);
});

describe("updateProfileAction", () => {
  it("met à jour le nom/téléphone et confirme", async () => {
    const res = await updateProfileAction(undefined, profileFd("Wassim B.", "+21622222222"));

    expect(res).toEqual({ success: "Vos informations ont été mises à jour." });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "Wassim B.", phone: "+21622222222", phoneVerified: false },
    });
  });

  it("ne remet pas phoneVerified à false si le numéro est inchangé", async () => {
    await updateProfileAction(undefined, profileFd("Wassim B.", "+21611111111"));

    const call = mockUpdate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(call.data).not.toHaveProperty("phoneVerified");
  });

  it("traite un téléphone vide comme null (pas de revérification forcée sur un compte qui n'en avait pas)", async () => {
    mockRequireUser.mockResolvedValue({ id: "u1", phone: null });

    await updateProfileAction(undefined, profileFd("Wassim B.", ""));

    const call = mockUpdate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(call.data.phone).toBeNull();
    expect(call.data).not.toHaveProperty("phoneVerified");
  });

  it("rejette un nom trop court (zod), sans écrire en base", async () => {
    const res = await updateProfileAction(undefined, profileFd("W"));

    expect(res).toEqual({ error: "Champs requis." });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("updateAvatarAction", () => {
  it("respecte le rate limit, sans toucher au disque", async () => {
    (assertRateLimit as unknown as Mock).mockResolvedValue(false);

    const res = await updateAvatarAction(undefined, avatarFd(new File(["x"], "a.jpg")));

    expect(res).toEqual({ error: "Trop de tentatives." });
    expect(saveUploadedImage).not.toHaveBeenCalled();
  });

  it("rejette une absence de fichier / fichier vide", async () => {
    const res = await updateAvatarAction(undefined, avatarFd(null));
    expect(res).toEqual({ error: "Erreur photo." });

    const resEmpty = await updateAvatarAction(
      undefined,
      avatarFd(new File([], "empty.jpg"))
    );
    expect(resEmpty).toEqual({ error: "Erreur photo." });
    expect(saveUploadedImage).not.toHaveBeenCalled();
  });

  it("remonte l'erreur si saveUploadedImage échoue la validation (magic bytes/taille)", async () => {
    (saveUploadedImage as unknown as Mock).mockResolvedValue(null);

    const res = await updateAvatarAction(undefined, avatarFd(new File(["x"], "a.jpg")));

    expect(res).toEqual({ error: "Erreur photo." });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("pose la nouvelle image et efface l'ancienne (best-effort)", async () => {
    (saveUploadedImage as unknown as Mock).mockResolvedValue("/uploads/new.jpg");
    mockFindUnique.mockResolvedValue({ image: "/uploads/old.jpg" });

    const res = await updateAvatarAction(undefined, avatarFd(new File(["x"], "a.jpg")));

    expect(res).toEqual({ success: "Photo de profil mise à jour." });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { image: "/uploads/new.jpg" },
    });
    expect(deleteUploadedImage).toHaveBeenCalledWith("/uploads/old.jpg");
  });

  it("n'appelle pas deleteUploadedImage si l'utilisateur n'avait pas de photo avant", async () => {
    (saveUploadedImage as unknown as Mock).mockResolvedValue("/uploads/new.jpg");
    mockFindUnique.mockResolvedValue({ image: null });

    await updateAvatarAction(undefined, avatarFd(new File(["x"], "a.jpg")));

    expect(deleteUploadedImage).not.toHaveBeenCalled();
  });
});

describe("removeAvatarAction", () => {
  it("efface la photo existante et confirme", async () => {
    mockFindUnique.mockResolvedValue({ image: "/uploads/old.jpg" });

    const res = await removeAvatarAction();

    expect(res).toEqual({ success: "Photo de profil supprimée." });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { image: null },
    });
    expect(deleteUploadedImage).toHaveBeenCalledWith("/uploads/old.jpg");
  });

  it("est un no-op silencieux (mais succès) si aucune photo n'existait", async () => {
    mockFindUnique.mockResolvedValue({ image: null });

    const res = await removeAvatarAction();

    expect(res).toEqual({ success: "Photo de profil supprimée." });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(deleteUploadedImage).not.toHaveBeenCalled();
  });
});
