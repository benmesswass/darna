/**
 * Tests — changePasswordAction.
 * Invariants : validation du mot de passe actuel, politique (≥ 8 car, chiffre),
 * refus du même mot de passe, et incrémentation du tokenVersion pour invalider
 * les sessions actives.
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

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("new-hashed"),
    compare: vi.fn(),
  },
}));

vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { champsRequis: "Champs requis.", tropDeTentatives: "Trop.", erreurInconnue: "Err." },
    profil: {
      mdpRegles: "Règles mdp.",
      mdpConfirmationInvalide: "Confirmation invalide.",
      mdpActuelInvalide: "Actuel invalide.",
      mdpIdentique: "Identique.",
      mdpEnregistre: "Enregistré.",
      mdpAucunMotDePasse: "Pas de mdp Google.",
    },
  }),
}));

import { changePasswordAction } from "@/actions/profile";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import bcrypt from "bcryptjs";

const mockRequireUser = requireUser as unknown as Mock;
const mockFindUnique = prisma.user.findUnique as unknown as Mock;
const mockUpdate = prisma.user.update as unknown as Mock;

function makeFd(current: string, next: string, confirm?: string): FormData {
  const fd = new FormData();
  fd.set("currentPassword", current);
  fd.set("newPassword", next);
  fd.set("confirmPassword", confirm ?? next);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.auditLog.create as unknown as Mock).mockResolvedValue({});
  mockRequireUser.mockResolvedValue({ id: "u1" });
  mockFindUnique.mockResolvedValue({ passwordHash: "old-hash" });
  mockUpdate.mockResolvedValue({});
});

describe("changePasswordAction", () => {
  it("valide le mot de passe actuel et pose le nouveau hash + incrémente tokenVersion", async () => {
    (bcrypt.compare as unknown as Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const res = await changePasswordAction(undefined, makeFd("oldpass1", "newpass1"));

    expect(res).toEqual({ success: "Enregistré." });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { passwordHash: "new-hashed", tokenVersion: { increment: 1 } },
    });
  });

  it("rejette un compte Google-only (passwordHash null, §L8.2) sans appeler bcrypt", async () => {
    mockFindUnique.mockResolvedValueOnce({ passwordHash: null });

    const res = await changePasswordAction(undefined, makeFd("anything1", "newpass1"));

    expect(res).toEqual({ error: "Pas de mdp Google." });
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejette si le mot de passe actuel est incorrect", async () => {
    (bcrypt.compare as unknown as Mock).mockResolvedValueOnce(false);

    const res = await changePasswordAction(undefined, makeFd("wrongpass1", "newpass1"));

    expect(res?.error).toBeDefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejette si le nouveau mot de passe est identique à l'actuel", async () => {
    (bcrypt.compare as unknown as Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    const res = await changePasswordAction(undefined, makeFd("same1pass", "same1pass"));

    expect(res?.error).toBeDefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejette si les mots de passe ne correspondent pas", async () => {
    const res = await changePasswordAction(undefined, makeFd("oldpass1", "newpass1", "mismatch1"));
    expect(res?.error).toBeDefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejette un mot de passe trop faible (sans chiffre)", async () => {
    const res = await changePasswordAction(undefined, makeFd("oldpass1", "weakpassword"));
    expect(res?.error).toBeDefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
