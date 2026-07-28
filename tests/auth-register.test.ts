/**
 * Tests — registerAction : la vérification d'email est branchée dès l'inscription.
 * On émet un OTP purpose EMAIL et on l'envoie ; un échec d'envoi ne casse pas
 * l'inscription (cohérence démo + filet en prod).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed") },
}));

vi.mock("@/lib/auth", () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: vi.fn().mockResolvedValue(true),
  clientIp: vi.fn().mockResolvedValue("127.0.0.1"),
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));

vi.mock("@/lib/redirect", () => ({ safeCallbackUrl: vi.fn() }));

vi.mock("@/lib/otp", () => ({ issueOtp: vi.fn() }));
vi.mock("@/lib/mailer", () => ({ sendEmail: vi.fn() }));

vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    auth: {
      inscriptionReussie: "Compte créé !",
      motDePasseNonIdentiques: "Les mots de passe ne sont pas identiques.",
      emailDejaUtilise: "Un compte existe déjà avec cet e-mail. Connectez-vous.",
      captchaEchec: "Vérification anti-robot échouée. Veuillez réessayer.",
    },
    common: { champsRequis: "Champs requis.", tropDeTentatives: "Trop de tentatives." },
    email: {
      mailSujet: "Darna — vérifiez votre adresse e-mail",
      mailCorpsHtml: (code: string) => `<p>Code : ${code}</p>`,
    },
  }),
}));

import { registerAction } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { issueOtp } from "@/lib/otp";
import { sendEmail } from "@/lib/mailer";
import { verifyTurnstile } from "@/lib/turnstile";

function formData(): FormData {
  const fd = new FormData();
  fd.set("name", "Wassim");
  fd.set("email", "new@test.tn");
  fd.set("password", "azerty12");
  fd.set("confirmPassword", "azerty12");
  fd.set("phone", "");
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findUnique as unknown as Mock).mockResolvedValue(null);
  (prisma.user.create as unknown as Mock).mockResolvedValue({ id: "u-1", email: "new@test.tn" });
  (prisma.auditLog.create as unknown as Mock).mockResolvedValue({});
  (issueOtp as unknown as Mock).mockResolvedValue("123456");
  (verifyTurnstile as unknown as Mock).mockResolvedValue(true);
});

describe("registerAction — vérification d'email à l'inscription", () => {
  it("émet un OTP purpose EMAIL et l'envoie après création du compte", async () => {
    (sendEmail as unknown as Mock).mockResolvedValue(false);

    const res = await registerAction(undefined, formData());

    expect(res).toEqual({ success: "Compte créé !", email: "new@test.tn" });
    expect(issueOtp).toHaveBeenCalledWith("u-1", "EMAIL");
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect((sendEmail as unknown as Mock).mock.calls[0][0]).toMatchObject({
      to: "new@test.tn",
    });
  });

  it("n'expose JAMAIS le code OTP dans la réponse d'inscription", async () => {
    (sendEmail as unknown as Mock).mockResolvedValue(false);
    const res = await registerAction(undefined, formData());
    expect(JSON.stringify(res)).not.toContain("123456");
  });

  it("réussit l'inscription même si l'envoi d'email échoue (cohérence démo)", async () => {
    (sendEmail as unknown as Mock).mockRejectedValue(new Error("provider down"));

    const res = await registerAction(undefined, formData());

    expect(res).toEqual({ success: "Compte créé !", email: "new@test.tn" });
    expect(issueOtp).toHaveBeenCalledWith("u-1", "EMAIL");
  });

  it("indique explicitement que l'e-mail est déjà utilisé (sans rien créer)", async () => {
    (prisma.user.findUnique as unknown as Mock).mockResolvedValue({ id: "existing" });

    const res = await registerAction(undefined, formData());

    expect(res).toEqual({
      error: "Un compte existe déjà avec cet e-mail. Connectez-vous.",
      values: { name: "Wassim", email: "new@test.tn", phone: "" },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(issueOtp).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("refuse l'inscription si la confirmation ne correspond pas au mot de passe", async () => {
    const fd = formData();
    fd.set("confirmPassword", "different9");

    const res = await registerAction(undefined, fd);

    // L'erreur repeuple les champs non sensibles ; les mots de passe ne sont
    // jamais renvoyés.
    expect(res).toEqual({
      error: "Les mots de passe ne sont pas identiques.",
      values: { name: "Wassim", email: "new@test.tn", phone: "" },
    });
    expect(JSON.stringify(res)).not.toContain("azerty12");
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(issueOtp).not.toHaveBeenCalled();
  });

  it("refuse l'inscription si le CAPTCHA échoue (avant toute écriture)", async () => {
    (verifyTurnstile as unknown as Mock).mockResolvedValue(false);

    const res = await registerAction(undefined, formData());

    expect(res).toEqual({
      error: "Vérification anti-robot échouée. Veuillez réessayer.",
      values: { name: "Wassim", email: "new@test.tn", phone: "" },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(issueOtp).not.toHaveBeenCalled();
  });
});
