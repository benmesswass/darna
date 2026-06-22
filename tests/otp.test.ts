import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    otpChallenge: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { issueOtp, verifyOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { hashOtp } from "@/lib/crypto";

const create = prisma.otpChallenge.create as unknown as Mock;
const findFirst = prisma.otpChallenge.findFirst as unknown as Mock;
const update = prisma.otpChallenge.update as unknown as Mock;
const deleteMany = prisma.otpChallenge.deleteMany as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  deleteMany.mockResolvedValue({ count: 0 });
  create.mockResolvedValue({});
  update.mockResolvedValue({});
});

describe("issueOtp", () => {
  it("émet un code 6 chiffres, purge les anciennes challenges KYC, ne stocke que le hash", async () => {
    const code = await issueOtp("u1");
    expect(code).toMatch(/^\d{6}$/);
    // Vérifie que la purge est scoped par userId + purpose
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: "u1", purpose: "KYC" } });
    expect(create).toHaveBeenCalledTimes(1);
    const createData = (create.mock.calls[0][0] as { data: Record<string, unknown> }).data;
    expect(createData.purpose).toBe("KYC");
    const stored = createData.codeHash as string;
    expect(stored).toBe(hashOtp(code));
    expect(stored).not.toContain(code);
  });

  it("émet un code EMAIL, purge les challenges EMAIL uniquement", async () => {
    const code = await issueOtp("u1", "EMAIL");
    expect(code).toMatch(/^\d{6}$/);
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: "u1", purpose: "EMAIL" } });
    const createData = (create.mock.calls[0][0] as { data: Record<string, unknown> }).data;
    expect(createData.purpose).toBe("EMAIL");
  });
});

describe("verifyOtp", () => {
  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);

  it("accepte le bon code KYC et consomme la challenge", async () => {
    findFirst.mockResolvedValue({ id: "c1", codeHash: hashOtp("654321"), expiresAt: future, attempts: 0 });
    expect(await verifyOtp("u1", "654321")).toBe(true);
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: "u1", purpose: "KYC" } });
  });

  it("accepte le bon code EMAIL et consomme la challenge", async () => {
    findFirst.mockResolvedValue({ id: "c1", codeHash: hashOtp("123456"), expiresAt: future, attempts: 0 });
    expect(await verifyOtp("u1", "123456", "EMAIL")).toBe(true);
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: "u1", purpose: "EMAIL" } });
  });

  it("rejette un mauvais code et incrémente les tentatives", async () => {
    findFirst.mockResolvedValue({ id: "c1", codeHash: hashOtp("654321"), expiresAt: future, attempts: 0 });
    expect(await verifyOtp("u1", "000000")).toBe(false);
    expect(update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { attempts: { increment: 1 } },
    });
  });

  it("rejette une challenge expirée et la purge par purpose", async () => {
    findFirst.mockResolvedValue({ id: "c1", codeHash: hashOtp("654321"), expiresAt: past, attempts: 0 });
    expect(await verifyOtp("u1", "654321")).toBe(false);
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: "u1", purpose: "KYC" } });
  });

  it("rejette quand les tentatives sont épuisées", async () => {
    findFirst.mockResolvedValue({ id: "c1", codeHash: hashOtp("654321"), expiresAt: future, attempts: 5 });
    expect(await verifyOtp("u1", "654321")).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejette quand aucune challenge n'existe", async () => {
    findFirst.mockResolvedValue(null);
    expect(await verifyOtp("u1", "654321")).toBe(false);
  });

  it("isolation : KYC et EMAIL sont des namespaces indépendants", async () => {
    // findFirst ne retourne rien pour EMAIL
    findFirst.mockResolvedValue(null);
    expect(await verifyOtp("u1", "654321", "EMAIL")).toBe(false);
    // La requête doit filtrer sur purpose=EMAIL
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ purpose: "EMAIL" }) })
    );
  });
});
