/**
 * Tests — resolveGoogleUser (LANCEMENT_ROADMAP.md §L8.2).
 * Invariants : trouve un compte existant par e-mail (liaison automatique,
 * sûre car Google a déjà vérifié l'adresse) ou en crée un nouveau
 * (passwordHash null, emailVerified true, rôle par défaut VOYAGEUR — §L8.1).
 * Module séparé de src/lib/auth.ts pour rester testable (import next-auth
 * en test échoue systématiquement, cf. login-failure-tracking.ts).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));

import { resolveGoogleUser } from "@/lib/google-account-linking";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const mockFindUnique = prisma.user.findUnique as unknown as Mock;
const mockCreate = prisma.user.create as unknown as Mock;
const mockLogAudit = logAudit as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveGoogleUser", () => {
  it("lie automatiquement un compte existant par e-mail (aucune création)", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", tokenVersion: 3 });

    const result = await resolveGoogleUser({
      email: "Wassim@Darna.tn",
      name: "Wassim",
      picture: null,
    });

    expect(result).toEqual({ id: "u1", tokenVersion: 3 });
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: "wassim@darna.tn" },
      select: { id: true, tokenVersion: true },
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockLogAudit).not.toHaveBeenCalled();
  });

  it("crée un nouveau compte (passwordHash null, emailVerified true) si l'e-mail est inconnu", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "u-new", tokenVersion: 0 });

    const result = await resolveGoogleUser({
      email: "nouveau@darna.tn",
      name: "Nouveau Compte",
      picture: "https://lh3.googleusercontent.com/photo.jpg",
    });

    expect(result).toEqual({ id: "u-new", tokenVersion: 0 });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        email: "nouveau@darna.tn",
        name: "Nouveau Compte",
        passwordHash: null,
        emailVerified: true,
        image: "https://lh3.googleusercontent.com/photo.jpg",
      },
      select: { id: true, tokenVersion: true },
    });
  });

  it("journalise REGISTER (via: google) à la création d'un nouveau compte", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "u-new", tokenVersion: 0 });

    await resolveGoogleUser({ email: "nouveau@darna.tn", name: "N", picture: null });

    expect(mockLogAudit).toHaveBeenCalledWith({
      action: "REGISTER",
      userId: "u-new",
      success: true,
      metadata: { via: "google" },
    });
  });

  it("utilise l'e-mail comme nom de repli si le profil Google n'a pas de nom", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "u-new", tokenVersion: 0 });

    await resolveGoogleUser({ email: "sansnom@darna.tn", name: null, picture: null });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "sansnom@darna.tn" }) })
    );
  });

  it("ne crée jamais deux comptes pour la même adresse (dédoublonnage par findUnique)", async () => {
    mockFindUnique.mockResolvedValue({ id: "existant", tokenVersion: 1 });

    await resolveGoogleUser({ email: "existant@darna.tn", name: "X", picture: null });
    await resolveGoogleUser({ email: "existant@darna.tn", name: "X", picture: null });

    expect(mockCreate).not.toHaveBeenCalled();
  });
});
