/**
 * Tests — split téléphone / CIN.
 * Couvre l'autorisation et le gating : phoneVerified, prérequis téléphone avant
 * CIN, et unicité de la CIN inter-comptes.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: vi.fn(), findFirst: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/otp", () => ({ issueOtp: vi.fn(), verifyOtp: vi.fn() }));
vi.mock("@/lib/otp-channel", () => ({
  sendOtp: vi.fn(),
  composeE164: vi.fn(() => "+21622345678"),
}));
vi.mock("@/lib/crypto", () => ({
  encryptSensitive: vi.fn((x: string) => x),
  hashCin: vi.fn(() => "HASH"),
}));
vi.mock("@/lib/modes", () => ({ kycMode: vi.fn(() => "demo") }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    kyc: {
      otpInvalide: "Code incorrect.",
      telephoneRequis: "Vérifiez d'abord votre téléphone.",
      cinDejaUtilisee: "CIN déjà utilisée.",
    },
    common: { champsRequis: "Champs requis.", tropDeTentatives: "Trop de tentatives." },
  }),
}));

import { verifyPhoneOtpAction, submitCinAction } from "@/actions/kyc";
import { requireUser } from "@/lib/session";
import { verifyOtp } from "@/lib/otp";
import { hashCin } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.update as unknown as Mock).mockResolvedValue({});
  (prisma.user.findFirst as unknown as Mock).mockResolvedValue(null);
});

describe("verifyPhoneOtpAction", () => {
  it("marque phoneVerified=true avec le bon code", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ id: "u1", phoneVerified: false, kycStatus: "NON_VERIFIE" });
    (verifyOtp as unknown as Mock).mockResolvedValue(true);

    const res = await verifyPhoneOtpAction(undefined, fd({ otp: "123456" }));

    expect(res).toEqual({ verified: true });
    expect((prisma.user.update as unknown as Mock).mock.calls[0][0].data).toEqual({ phoneVerified: true });
  });

  it("rejette un mauvais code sans rien modifier", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ id: "u1", phoneVerified: false, kycStatus: "NON_VERIFIE" });
    (verifyOtp as unknown as Mock).mockResolvedValue(false);

    const res = await verifyPhoneOtpAction(undefined, fd({ otp: "000000" }));

    expect(res).toEqual({ error: "Code incorrect." });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe("submitCinAction", () => {
  it("refuse si le téléphone n'est pas vérifié", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ id: "u1", phoneVerified: false, kycStatus: "NON_VERIFIE" });

    const res = await submitCinAction(undefined, fd({ cin: "08123456" }));

    expect(res).toEqual({ error: "Vérifiez d'abord votre téléphone." });
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("refuse une CIN déjà utilisée par un autre compte", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ id: "u1", phoneVerified: true, kycStatus: "NON_VERIFIE" });
    (prisma.user.findFirst as unknown as Mock).mockResolvedValue({ id: "autre" });

    const res = await submitCinAction(undefined, fd({ cin: "08123456" }));

    expect(res).toEqual({ error: "CIN déjà utilisée." });
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { cinHash: "HASH", NOT: { id: "u1" } },
      select: { id: true },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("valide la CIN (unique) → kycStatus + cinHash + audit", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ id: "u1", phoneVerified: true, kycStatus: "NON_VERIFIE" });
    (prisma.user.findFirst as unknown as Mock).mockResolvedValue(null);

    const res = await submitCinAction(undefined, fd({ cin: "08123456" }));

    expect(res).toEqual({ verified: true, demo: true });
    expect(hashCin).toHaveBeenCalledWith("08123456");
    const data = (prisma.user.update as unknown as Mock).mock.calls[0][0].data;
    expect(data.cinHash).toBe("HASH");
    expect(data.kycStatus).toBe("DEMO_VERIFIE");
  });

  it("ne re-vérifie pas une identité déjà vérifiée", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ id: "u1", phoneVerified: true, kycStatus: "VERIFIE" });

    const res = await submitCinAction(undefined, fd({ cin: "08123456" }));

    expect(res).toEqual({ verified: true, demo: false });
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
