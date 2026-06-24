import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { issueResetToken, consumeResetToken } from "@/lib/reset-token";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/crypto";

const create = prisma.passwordResetToken.create as unknown as Mock;
const findUnique = prisma.passwordResetToken.findUnique as unknown as Mock;
const deleteMany = prisma.passwordResetToken.deleteMany as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  deleteMany.mockResolvedValue({ count: 0 });
  create.mockResolvedValue({});
});

describe("issueResetToken", () => {
  it("purge les jetons précédents de l'utilisateur et ne stocke que le hash", async () => {
    const token = await issueResetToken("u1");

    // base64url, 256 bits ⇒ jamais vide ni avec caractères non-URL.
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });

    const data = (create.mock.calls[0][0] as { data: Record<string, unknown> }).data;
    expect(data.userId).toBe("u1");
    // Le jeton n'est JAMAIS stocké en clair : seul son hash l'est.
    expect(data.tokenHash).toBe(hashResetToken(token));
    expect(data.tokenHash).not.toBe(token);
    expect(data.expiresAt).toBeInstanceOf(Date);
    expect((data.expiresAt as Date).getTime()).toBeGreaterThan(Date.now());
  });

  it("émet des jetons distincts à chaque appel", async () => {
    const a = await issueResetToken("u1");
    const b = await issueResetToken("u1");
    expect(a).not.toBe(b);
  });
});

describe("consumeResetToken", () => {
  it("renvoie l'userId et purge le jeton (usage unique) si valide", async () => {
    findUnique.mockResolvedValue({
      userId: "u1",
      expiresAt: new Date(Date.now() + 60_000),
    });

    const userId = await consumeResetToken("tok");

    expect(userId).toBe("u1");
    // Recherche par HASH, jamais par jeton en clair.
    expect(findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashResetToken("tok") },
      select: { userId: true, expiresAt: true },
    });
    // Usage unique : purge après consommation.
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  it("refuse un jeton inconnu", async () => {
    findUnique.mockResolvedValue(null);
    expect(await consumeResetToken("nope")).toBeNull();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("refuse et purge un jeton expiré", async () => {
    findUnique.mockResolvedValue({
      userId: "u1",
      expiresAt: new Date(Date.now() - 1),
    });

    expect(await consumeResetToken("old")).toBeNull();
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });
});
