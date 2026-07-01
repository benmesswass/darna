/**
 * Tests — requestPasswordResetAction / resetPasswordAction.
 * Invariants : anti-énumération (message générique), jamais d'exposition de
 * jeton hors mode démo, consommation usage-unique, message générique sur jeton
 * invalide, et l'envoi e-mail ne casse jamais le flux.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed-pwd") },
}));

vi.mock("@/lib/auth", () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("@/lib/redirect", () => ({ safeCallbackUrl: vi.fn() }));
vi.mock("@/lib/otp", () => ({ issueOtp: vi.fn() }));

vi.mock("@/lib/reset-token", () => ({
  issueResetToken: vi.fn(),
  consumeResetToken: vi.fn(),
}));
vi.mock("@/lib/mailer", () => ({
  sendEmail: vi.fn(),
  getEmailProvider: vi.fn(),
}));
vi.mock("@/lib/config", () => ({ SITE_URL: "https://darna.tn", SERVICE_FEE_RATE: 0.08 }));

vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { champsRequis: "Champs requis.", tropDeTentatives: "Trop de tentatives." },
    auth: {
      resetEmailEnvoye: "Si un compte existe, un lien a été envoyé.",
      resetLienInvalide: "Lien invalide ou expiré.",
      resetReussi: "Mot de passe réinitialisé.",
      resetMotDePasseInvalide: "Mot de passe invalide.",
      resetMailSujet: "Reset",
      resetMailCorpsHtml: (url: string) => `<a href="${url}">reset</a>`,
    },
  }),
}));

import { requestPasswordResetAction, resetPasswordAction } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { issueResetToken, consumeResetToken } from "@/lib/reset-token";
import { sendEmail, getEmailProvider } from "@/lib/mailer";

const findUnique = prisma.user.findUnique as unknown as Mock;
const update = prisma.user.update as unknown as Mock;

function reqFd(email: string): FormData {
  const fd = new FormData();
  fd.set("email", email);
  return fd;
}
function resetFd(token: string, password: string): FormData {
  const fd = new FormData();
  fd.set("token", token);
  fd.set("password", password);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.auditLog.create as unknown as Mock).mockResolvedValue({});
  (issueResetToken as unknown as Mock).mockResolvedValue("a".repeat(43));
  (getEmailProvider as unknown as Mock).mockReturnValue("demo");
});

describe("requestPasswordResetAction", () => {
  it("compte inconnu : message générique, aucun jeton émis (anti-énumération)", async () => {
    findUnique.mockResolvedValue(null);
    const res = await requestPasswordResetAction(undefined, reqFd("ghost@darna.tn"));
    expect(res).toEqual({ success: "Si un compte existe, un lien a été envoyé." });
    expect(issueResetToken).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("mode démo : surface le lien (resetUrl) avec le jeton dans l'URL", async () => {
    findUnique.mockResolvedValue({ id: "u1", email: "w@darna.tn" });
    (sendEmail as unknown as Mock).mockResolvedValue(false);

    const res = await requestPasswordResetAction(undefined, reqFd("w@darna.tn"));

    expect(res?.success).toBeDefined();
    expect(res?.resetUrl).toContain("https://darna.tn/reinitialiser-mot-de-passe?token=");
    expect(res?.resetUrl).toContain("a".repeat(43));
  });

  it("mode resend : n'expose JAMAIS le lien dans la réponse", async () => {
    findUnique.mockResolvedValue({ id: "u1", email: "w@darna.tn" });
    (getEmailProvider as unknown as Mock).mockReturnValue("resend");
    (sendEmail as unknown as Mock).mockResolvedValue(true);

    const res = await requestPasswordResetAction(undefined, reqFd("w@darna.tn"));

    expect(res).toEqual({ success: "Si un compte existe, un lien a été envoyé." });
    expect(res?.resetUrl).toBeUndefined();
  });

  it("un échec d'envoi e-mail ne casse pas le flux", async () => {
    findUnique.mockResolvedValue({ id: "u1", email: "w@darna.tn" });
    (sendEmail as unknown as Mock).mockRejectedValue(new Error("down"));

    const res = await requestPasswordResetAction(undefined, reqFd("w@darna.tn"));
    expect(res?.success).toBeDefined();
  });
});

describe("resetPasswordAction", () => {
  it("jeton valide : pose un nouveau hash et confirme", async () => {
    (consumeResetToken as unknown as Mock).mockResolvedValue("u1");
    update.mockResolvedValue({});

    const res = await resetPasswordAction(undefined, resetFd("t".repeat(43), "azerty12"));

    expect(res).toEqual({ success: "Mot de passe réinitialisé." });
    expect(update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { passwordHash: "hashed-pwd", tokenVersion: { increment: 1 } },
    });
  });

  it("incrémente tokenVersion pour invalider les sessions actives", async () => {
    (consumeResetToken as unknown as Mock).mockResolvedValue("u2");
    update.mockResolvedValue({});

    await resetPasswordAction(undefined, resetFd("t".repeat(43), "azerty12"));

    const updateCall = update.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(updateCall.data.tokenVersion).toEqual({ increment: 1 });
  });

  it("jeton invalide/expiré : message générique, aucun update", async () => {
    (consumeResetToken as unknown as Mock).mockResolvedValue(null);

    const res = await resetPasswordAction(undefined, resetFd("t".repeat(43), "azerty12"));

    expect(res).toEqual({ error: "Lien invalide ou expiré." });
    expect(update).not.toHaveBeenCalled();
  });

  it("mot de passe trop faible : rejeté avant toute consommation de jeton", async () => {
    const res = await resetPasswordAction(undefined, resetFd("t".repeat(43), "short"));
    expect(res).toEqual({ error: "Mot de passe invalide." });
    expect(consumeResetToken).not.toHaveBeenCalled();
  });
});
