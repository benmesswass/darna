/**
 * Tests — deleteAccountAction (LANCEMENT_ROADMAP.md §L7.3).
 * Invariants : ré-authentification par mot de passe, blocage si réservation
 * active (voyageur OU hôte via ses annonces), anonymisation en place (jamais
 * un vrai DELETE), tokenVersion invalidé, annonces actives délistées via
 * expiresAt, déconnexion en fin de flux.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    booking: { findFirst: vi.fn() },
    property: { updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
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

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("unusable-hashed"),
    compare: vi.fn(),
  },
}));

vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { champsRequis: "Champs requis.", tropDeTentatives: "Trop.", erreurInconnue: "Err." },
    profil: {
      mdpActuelInvalide: "Actuel invalide.",
      supprimerMdpRequis: "Mot de passe requis.",
      supprimerReservationActive: "Réservation active.",
    },
  }),
}));

import { deleteAccountAction } from "@/actions/profile";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { deleteUploadedImage } from "@/lib/uploads";
import { signOut } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

const mockRequireUser = requireUser as unknown as Mock;
const mockFindUnique = prisma.user.findUnique as unknown as Mock;
const mockBookingFindFirst = prisma.booking.findFirst as unknown as Mock;
const mockTransaction = prisma.$transaction as unknown as Mock;
const mockLogAudit = logAudit as unknown as Mock;
const mockDeleteUploadedImage = deleteUploadedImage as unknown as Mock;
const mockSignOut = signOut as unknown as Mock;
const mockAssertRateLimit = assertRateLimit as unknown as Mock;

function makeFd(password: string): FormData {
  const fd = new FormData();
  fd.set("password", password);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertRateLimit.mockResolvedValue(true);
  mockRequireUser.mockResolvedValue({ id: "u1" });
  mockFindUnique.mockResolvedValue({ passwordHash: "old-hash", image: null });
  mockBookingFindFirst.mockResolvedValue(null);
  mockTransaction.mockResolvedValue([{}, {}]);
  (bcrypt.compare as unknown as Mock).mockResolvedValue(true);
});

describe("deleteAccountAction", () => {
  it("rejette si le rate limit est dépassé", async () => {
    mockAssertRateLimit.mockResolvedValueOnce(false);

    const res = await deleteAccountAction(undefined, makeFd("pass1234"));

    expect(res?.error).toBe("Trop.");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejette un mot de passe vide sans toucher à la base", async () => {
    const res = await deleteAccountAction(undefined, makeFd(""));

    expect(res?.error).toBe("Mot de passe requis.");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("rejette si le mot de passe est incorrect et journalise l'échec", async () => {
    (bcrypt.compare as unknown as Mock).mockResolvedValueOnce(false);

    const res = await deleteAccountAction(undefined, makeFd("wrongpass1"));

    expect(res?.error).toBe("Actuel invalide.");
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith({
      action: "ACCOUNT_DELETED",
      userId: "u1",
      success: false,
      metadata: { reason: "wrong_password" },
    });
  });

  it("bloque si une réservation est active en tant que voyageur ou hôte", async () => {
    mockBookingFindFirst.mockResolvedValueOnce({ id: "b1" });

    const res = await deleteAccountAction(undefined, makeFd("goodpass1"));

    expect(res?.error).toBe("Réservation active.");
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockBookingFindFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ guestId: "u1" }, { property: { ownerId: "u1" } }],
        status: { notIn: ["ANNULEE", "TERMINEE"] },
      },
      select: { id: true },
    });
  });

  it("n'est pas bloqué par des réservations ANNULEE/TERMINEE (findFirst filtre déjà notIn)", async () => {
    mockBookingFindFirst.mockResolvedValueOnce(null);

    const res = await deleteAccountAction(undefined, makeFd("goodpass1"));

    expect(res).toBeUndefined();
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("anonymise le compte, invalide le mot de passe/tokenVersion et déliste les annonces actives", async () => {
    await deleteAccountAction(undefined, makeFd("goodpass1"));

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    const calls = mockTransaction.mock.calls[0][0];
    expect(calls).toHaveLength(2);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          name: "Utilisateur supprimé",
          phone: null,
          image: null,
          cin: null,
          cinHash: null,
          kycStatus: "NON_VERIFIE",
          passwordHash: "unusable-hashed",
          tokenVersion: { increment: 1 },
        }),
      })
    );

    const userData = (prisma.user.update as unknown as Mock).mock.calls[0][0].data;
    expect(userData.email).toMatch(/^deleted-[0-9a-f-]+@darna\.invalid$/);
    expect(userData.deletedAt).toBeInstanceOf(Date);

    expect(prisma.property.updateMany).toHaveBeenCalledWith({
      where: { ownerId: "u1", expiresAt: { gt: expect.any(Date) } },
      data: { expiresAt: expect.any(Date) },
    });
  });

  it("efface l'ancien avatar sur disque si présent", async () => {
    mockFindUnique.mockResolvedValueOnce({ passwordHash: "old-hash", image: "/uploads/old.jpg" });

    await deleteAccountAction(undefined, makeFd("goodpass1"));

    expect(mockDeleteUploadedImage).toHaveBeenCalledWith("/uploads/old.jpg");
  });

  it("ne tente pas d'effacer d'avatar si aucun n'est défini", async () => {
    await deleteAccountAction(undefined, makeFd("goodpass1"));

    expect(mockDeleteUploadedImage).not.toHaveBeenCalled();
  });

  it("journalise ACCOUNT_DELETED en succès puis déconnecte l'utilisateur", async () => {
    await deleteAccountAction(undefined, makeFd("goodpass1"));

    expect(mockLogAudit).toHaveBeenCalledWith({
      action: "ACCOUNT_DELETED",
      userId: "u1",
      success: true,
    });
    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/" });
  });
});
