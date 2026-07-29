/**
 * P2.8 (ROADMAP.md) — applyWakilAction : le CAPTCHA Turnstile est vérifié
 * AVANT toute écriture, comme sur inscription/connexion (même helper
 * fail-closed, cf. tests/turnstile.test.ts pour verifyTurnstile lui-même).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { wakilApplication: { create: vi.fn() } },
}));
vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: vi.fn().mockResolvedValue(true),
  clientIp: vi.fn().mockResolvedValue("127.0.0.1"),
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/admin-notify", () => ({ notifyAdmins: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    auth: { captchaEchec: "Vérification anti-robot échouée. Veuillez réessayer." },
    common: { tropDeTentatives: "Trop de tentatives.", champsRequis: "Champs requis." },
    wakil: { candidatureEnvoyee: "Candidature envoyée !" },
  }),
}));

import { applyWakilAction } from "@/actions/wakil";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";

function formWith(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("name", "Sami");
  fd.set("email", "sami@test.tn");
  fd.set("phone", "+216 55 778 899");
  fd.set("city", "Sousse");
  fd.set("motivation", "Je connais très bien la région et je veux aider Darna.");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.wakilApplication.create as unknown as Mock).mockResolvedValue({ id: "wa-1" });
  (verifyTurnstile as unknown as Mock).mockResolvedValue(true);
});

describe("applyWakilAction — CAPTCHA (P2.8)", () => {
  it("crée la candidature quand le CAPTCHA passe", async () => {
    const res = await applyWakilAction(undefined, formWith());

    expect(res).toEqual({ success: "Candidature envoyée !" });
    expect(prisma.wakilApplication.create).toHaveBeenCalledTimes(1);
  });

  it("refuse la candidature si le CAPTCHA échoue, avant toute écriture", async () => {
    (verifyTurnstile as unknown as Mock).mockResolvedValue(false);

    const res = await applyWakilAction(undefined, formWith());

    expect(res).toEqual({ error: "Vérification anti-robot échouée. Veuillez réessayer." });
    expect(prisma.wakilApplication.create).not.toHaveBeenCalled();
  });
});
