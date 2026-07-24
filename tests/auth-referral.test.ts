/**
 * CROISSANCE_ROADMAP.md §CR1 — bonus filleul : un code de parrainage valide
 * transmis à l'inscription (?ref=CODE) pose `User.referredById` UNE SEULE
 * FOIS (à la création) et crédite +15 TND (BIENVENUE_PARRAINAGE) immédiatement
 * — jamais bloquant pour l'inscription (même philosophie que l'envoi d'OTP).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed") } }));
vi.mock("@/lib/auth", () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: vi.fn().mockResolvedValue(true),
  clientIp: vi.fn().mockResolvedValue("127.0.0.1"),
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/redirect", () => ({ safeCallbackUrl: vi.fn() }));
vi.mock("@/lib/otp", () => ({ issueOtp: vi.fn().mockResolvedValue("123456") }));
vi.mock("@/lib/mailer", () => ({ sendEmail: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/credits", () => ({
  findUserByReferralCode: vi.fn(),
  issueCredit: vi.fn(),
}));

vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    auth: {
      inscriptionReussie: "Compte créé !",
      motDePasseNonIdentiques: "Les mots de passe ne sont pas identiques.",
      emailDejaUtilise: "Un compte existe déjà avec cet e-mail. Connectez-vous.",
      captchaEchec: "Vérification anti-robot échouée. Veuillez réessayer.",
    },
    common: { champsRequis: "Champs requis.", tropDeTentatives: "Trop de tentatives." },
    email: { mailSujet: "Sujet", mailCorpsHtml: (code: string) => `<p>${code}</p>` },
  }),
}));

import { registerAction } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { findUserByReferralCode, issueCredit } from "@/lib/credits";
import { logAudit } from "@/lib/audit";

const userFindUnique = prisma.user.findUnique as unknown as Mock;
const userCreate = prisma.user.create as unknown as Mock;
const findReferrer = findUserByReferralCode as unknown as Mock;
const issueCreditMock = issueCredit as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;

function formData(ref?: string): FormData {
  const fd = new FormData();
  fd.set("name", "Wassim");
  fd.set("email", "new@test.tn");
  fd.set("password", "azerty12");
  fd.set("confirmPassword", "azerty12");
  fd.set("phone", "");
  fd.set("role", "VOYAGEUR");
  if (ref) fd.set("ref", ref);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  userFindUnique.mockResolvedValue(null);
  userCreate.mockResolvedValue({ id: "u-1", email: "new@test.tn" });
  findReferrer.mockResolvedValue(null);
  issueCreditMock.mockResolvedValue(undefined);
});

describe("registerAction — parrainage (§CR1)", () => {
  it("sans code : ne cherche aucun parrain, referredById absent, aucun crédit émis", async () => {
    await registerAction(undefined, formData());

    expect(findReferrer).not.toHaveBeenCalled();
    expect(userCreate.mock.calls[0][0].data.referredById).toBeUndefined();
    expect(issueCreditMock).not.toHaveBeenCalled();
  });

  it("code valide : pose referredById à la création et crédite +15 TND (BIENVENUE_PARRAINAGE)", async () => {
    findReferrer.mockResolvedValue({ id: "parrain-1" });

    await registerAction(undefined, formData("ABCD1234"));

    expect(findReferrer).toHaveBeenCalledWith("ABCD1234");
    expect(userCreate.mock.calls[0][0].data.referredById).toBe("parrain-1");
    expect(issueCreditMock).toHaveBeenCalledWith({
      userId: "u-1",
      amount: 15,
      motif: "BIENVENUE_PARRAINAGE",
    });
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "REFERRAL_SIGNUP_CREDIT_ISSUED", userId: "u-1", success: true })
    );
  });

  it("code inconnu/invalide : inscription normale, aucun crédit, aucune erreur", async () => {
    findReferrer.mockResolvedValue(null);

    const res = await registerAction(undefined, formData("INCONNU"));

    expect(res).toEqual({ success: "Compte créé !", email: "new@test.tn" });
    expect(userCreate.mock.calls[0][0].data.referredById).toBeUndefined();
    expect(issueCreditMock).not.toHaveBeenCalled();
  });

  it("l'inscription réussit même si l'émission du crédit échoue (jamais bloquant)", async () => {
    findReferrer.mockResolvedValue({ id: "parrain-1" });
    issueCreditMock.mockRejectedValue(new Error("db down"));

    const res = await registerAction(undefined, formData("ABCD1234"));

    expect(res).toEqual({ success: "Compte créé !", email: "new@test.tn" });
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "REFERRAL_SIGNUP_CREDIT_ISSUED", success: false })
    );
  });
});
