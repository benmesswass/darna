/**
 * D4 (QA_ROADMAP §3) — Négatifs des gardes d'autorisation (src/lib/session.ts).
 *
 * Prouve que les quatre gardes serveur refusent le mauvais rôle / l'absence de
 * session. C'est le point unique d'où dépend toute l'autorisation verticale :
 * un seul gate trop permissif = escalade de privilèges sur tout le produit.
 *
 * `cache` de React est neutralisé (identité) pour que chaque appel relise la
 * session mockée — sinon la mémoïsation par rendu fausserait les cas successifs.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn() } } }));

import {
  requireUser,
  requireLister,
  requireAdmin,
  requireWakilOrAdmin,
} from "@/lib/session";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const authMock = auth as unknown as Mock;
const findUnique = prisma.user.findUnique as unknown as Mock;

const USER_ID = "cluser0000000000000000001";

/** Installe (ou non) un utilisateur connecté de rôle donné. */
function loginAs(user: { role: string; isWakil?: boolean } | null): void {
  if (!user) {
    authMock.mockResolvedValue(null);
    return;
  }
  authMock.mockResolvedValue({ user: { id: USER_ID } });
  findUnique.mockResolvedValue({
    id: USER_ID,
    name: "Test",
    email: "t@test.tn",
    phone: null,
    image: null,
    role: user.role,
    kycStatus: "VERIFIE",
    phoneVerified: true,
    emailVerified: true,
    isWakil: user.isWakil ?? false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireUser", () => {
  it("lève NON_AUTHENTIFIE en l'absence de session", async () => {
    loginAs(null);
    await expect(requireUser()).rejects.toThrow("NON_AUTHENTIFIE");
  });

  it("lève NON_AUTHENTIFIE si l'utilisateur n'existe plus en base", async () => {
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    findUnique.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("NON_AUTHENTIFIE");
  });

  it("retourne l'utilisateur connecté", async () => {
    loginAs({ role: "VOYAGEUR" });
    await expect(requireUser()).resolves.toMatchObject({ id: USER_ID });
  });
});

describe("requireLister", () => {
  it("refuse un VOYAGEUR", async () => {
    loginAs({ role: "VOYAGEUR" });
    await expect(requireLister()).rejects.toThrow("ROLE_INSUFFISANT");
  });

  it("autorise un HOTE", async () => {
    loginAs({ role: "HOTE" });
    await expect(requireLister()).resolves.toMatchObject({ role: "HOTE" });
  });

  it("autorise une AGENCE", async () => {
    loginAs({ role: "AGENCE" });
    await expect(requireLister()).resolves.toMatchObject({ role: "AGENCE" });
  });
});

describe("requireAdmin", () => {
  it("refuse un HOTE", async () => {
    loginAs({ role: "HOTE" });
    await expect(requireAdmin()).rejects.toThrow("ROLE_INSUFFISANT");
  });

  it("autorise un ADMIN", async () => {
    loginAs({ role: "ADMIN" });
    await expect(requireAdmin()).resolves.toMatchObject({ role: "ADMIN" });
  });
});

describe("requireWakilOrAdmin", () => {
  it("refuse un VOYAGEUR non-wakil", async () => {
    loginAs({ role: "VOYAGEUR", isWakil: false });
    await expect(requireWakilOrAdmin()).rejects.toThrow("ROLE_INSUFFISANT");
  });

  it("autorise un wakil (isWakil=true) même non-admin", async () => {
    loginAs({ role: "HOTE", isWakil: true });
    await expect(requireWakilOrAdmin()).resolves.toMatchObject({ isWakil: true });
  });

  it("autorise un ADMIN", async () => {
    loginAs({ role: "ADMIN" });
    await expect(requireWakilOrAdmin()).resolves.toMatchObject({ role: "ADMIN" });
  });
});
