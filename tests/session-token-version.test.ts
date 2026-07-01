/**
 * Tests — invalidation de session via tokenVersion.
 * Invariant : après un changement de mot de passe (reset ou profil), le
 * tokenVersion en base augmente → getSessionUser renvoie null pour tout JWT
 * émis avant la modification (version obsolète).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { getSessionUser } from "@/lib/session";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as Mock;
const mockFindUnique = prisma.user.findUnique as unknown as Mock;

function makeSession(tokenVersion?: number) {
  return { user: { id: "u1", tokenVersion } };
}

function makeDbUser(tokenVersion: number) {
  return {
    id: "u1", name: "Wassim", email: "w@darna.tn",
    phone: null, image: null, role: "VOYAGEUR",
    kycStatus: "NON_VERIFIE", phoneVerified: false,
    emailVerified: false, isWakil: false,
    tokenVersion,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getSessionUser — tokenVersion guard", () => {
  it("laisse passer une session dont le tokenVersion correspond à la DB", async () => {
    mockAuth.mockResolvedValue(makeSession(0));
    mockFindUnique.mockResolvedValue(makeDbUser(0));

    const user = await getSessionUser();
    expect(user).not.toBeNull();
    expect(user?.id).toBe("u1");
  });

  it("rejette une session dont le tokenVersion est inférieur (JWT périmé après reset)", async () => {
    mockAuth.mockResolvedValue(makeSession(0));
    mockFindUnique.mockResolvedValue(makeDbUser(1));

    const user = await getSessionUser();
    expect(user).toBeNull();
  });

  it("JWT sans tokenVersion (ancien) est traité comme 0 — accepté si DB = 0", async () => {
    mockAuth.mockResolvedValue(makeSession(undefined));
    mockFindUnique.mockResolvedValue(makeDbUser(0));

    const user = await getSessionUser();
    expect(user).not.toBeNull();
  });

  it("JWT sans tokenVersion (ancien) est rejeté si DB > 0 (mot de passe changé)", async () => {
    mockAuth.mockResolvedValue(makeSession(undefined));
    mockFindUnique.mockResolvedValue(makeDbUser(1));

    const user = await getSessionUser();
    expect(user).toBeNull();
  });

  it("n'expose pas tokenVersion dans l'objet SessionUser retourné", async () => {
    mockAuth.mockResolvedValue(makeSession(0));
    mockFindUnique.mockResolvedValue(makeDbUser(0));

    const user = await getSessionUser();
    expect(user).not.toBeNull();
    expect("tokenVersion" in (user ?? {})).toBe(false);
  });

  it("retourne null si l'utilisateur n'existe plus en base", async () => {
    mockAuth.mockResolvedValue(makeSession(0));
    mockFindUnique.mockResolvedValue(null);

    const user = await getSessionUser();
    expect(user).toBeNull();
  });
});
