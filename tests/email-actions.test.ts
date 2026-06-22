/**
 * Tests PR5 — requestEmailOtpAction / verifyEmailOtpAction
 * Vérifie l'isolation des purposes KYC / EMAIL.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/session", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/otp", () => ({
  issueOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/mailer", () => ({
  sendEmail: vi.fn(),
  getEmailProvider: vi.fn(),
  maskEmail: vi.fn().mockReturnValue("t•••t@test.tn"),
}));

vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
  clientIp: vi.fn().mockResolvedValue("127.0.0.1"),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    email: {
      otpInvalide: "Code incorrect.",
      mailSujet: "Darna — vérifiez votre adresse e-mail",
      mailCorpsHtml: (code: string) => `<p>Code : ${code}</p>`,
    },
    common: {
      tropDeTentatives: "Trop de tentatives.",
    },
  }),
}));

import { requestEmailOtpAction, verifyEmailOtpAction } from "@/actions/email";
import { requireUser } from "@/lib/session";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { sendEmail, getEmailProvider } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

const mockUser = {
  id: "u-1",
  email: "test@test.tn",
  emailVerified: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.update as unknown as Mock).mockResolvedValue({});
  (prisma.auditLog.create as unknown as Mock).mockResolvedValue({});
});

// ── requestEmailOtpAction ─────────────────────────────────────────────────────

describe("requestEmailOtpAction", () => {
  it("retourne verified:true si emailVerified déjà vrai", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ ...mockUser, emailVerified: true });
    const result = await requestEmailOtpAction(undefined);
    expect(result?.verified).toBe(true);
    expect(issueOtp).not.toHaveBeenCalled();
  });

  it("émet un OTP EMAIL et retourne le code en mode démo", async () => {
    (requireUser as unknown as Mock).mockResolvedValue(mockUser);
    (issueOtp as unknown as Mock).mockResolvedValue("123456");
    (getEmailProvider as unknown as Mock).mockReturnValue("demo");
    (sendEmail as unknown as Mock).mockResolvedValue(false);

    const result = await requestEmailOtpAction(undefined);

    // issueOtp appelé avec purpose="EMAIL"
    expect(issueOtp).toHaveBeenCalledWith("u-1", "EMAIL");
    expect(result?.sent).toBe(true);
    expect(result?.otp).toBe("123456");
    expect(result?.demo).toBe(true);
  });

  it("ne retourne pas le code si email réellement envoyé (mode resend)", async () => {
    (requireUser as unknown as Mock).mockResolvedValue(mockUser);
    (issueOtp as unknown as Mock).mockResolvedValue("999999");
    (getEmailProvider as unknown as Mock).mockReturnValue("resend");
    (sendEmail as unknown as Mock).mockResolvedValue(true);

    const result = await requestEmailOtpAction(undefined);

    expect(result?.sent).toBe(true);
    expect(result?.otp).toBeUndefined();
  });
});

// ── verifyEmailOtpAction ──────────────────────────────────────────────────────

describe("verifyEmailOtpAction", () => {
  it("vérifie l'email avec le bon code", async () => {
    (requireUser as unknown as Mock).mockResolvedValue(mockUser);
    (verifyOtp as unknown as Mock).mockResolvedValue(true);

    const fd = new FormData();
    fd.set("otp", "123456");
    const result = await verifyEmailOtpAction(undefined, fd);

    // verifyOtp appelé avec purpose="EMAIL" (isolation critique)
    expect(verifyOtp).toHaveBeenCalledWith("u-1", "123456", "EMAIL");
    expect(result?.verified).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { emailVerified: true } })
    );
  });

  it("rejette un code invalide (format)", async () => {
    (requireUser as unknown as Mock).mockResolvedValue(mockUser);

    const fd = new FormData();
    fd.set("otp", "abc");
    const result = await verifyEmailOtpAction(undefined, fd);

    expect(result?.error).toBeDefined();
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("rejette un code OTP incorrect", async () => {
    (requireUser as unknown as Mock).mockResolvedValue(mockUser);
    (verifyOtp as unknown as Mock).mockResolvedValue(false);

    const fd = new FormData();
    fd.set("otp", "000000");
    const result = await verifyEmailOtpAction(undefined, fd);

    expect(result?.error).toBeDefined();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("ne re-vérifie pas si déjà vérifié", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ ...mockUser, emailVerified: true });

    const fd = new FormData();
    fd.set("otp", "123456");
    const result = await verifyEmailOtpAction(undefined, fd);

    expect(result?.verified).toBe(true);
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("isolation : purpose EMAIL distinct de KYC", async () => {
    (requireUser as unknown as Mock).mockResolvedValue(mockUser);
    (verifyOtp as unknown as Mock).mockResolvedValue(true);

    const fd = new FormData();
    fd.set("otp", "654321");
    await verifyEmailOtpAction(undefined, fd);

    // Toujours purpose EMAIL, jamais KYC
    const calls = (verifyOtp as unknown as Mock).mock.calls;
    expect(calls[0][2]).toBe("EMAIL");
    expect(calls[0][2]).not.toBe("KYC");
  });
});
