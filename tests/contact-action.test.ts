/**
 * P2.8 (ROADMAP.md) — createContactRequestAction : le CAPTCHA Turnstile est
 * vérifié AVANT toute écriture, comme sur inscription/connexion (même helper
 * fail-closed, cf. tests/turnstile.test.ts pour verifyTurnstile lui-même).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn() },
    contactRequest: { create: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: vi.fn().mockResolvedValue(true),
  clientIp: vi.fn().mockResolvedValue("127.0.0.1"),
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    auth: { captchaEchec: "Vérification anti-robot échouée. Veuillez réessayer." },
    common: { tropDeTentatives: "Trop de tentatives.", champsRequis: "Champs requis.", erreurInconnue: "Erreur inconnue." },
    contact: { envoye: "Message envoyé !" },
  }),
}));

import { createContactRequestAction } from "@/actions/contact";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";

const PROPERTY = { id: "clproperty000000000000001", type: "VENTE", status: "ACTIVE" };

function formWith(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("propertyId", PROPERTY.id);
  fd.set("name", "Yassine");
  fd.set("email", "yassine@test.tn");
  fd.set("phone", "+216 22 345 678");
  fd.set("message", "Bonjour, ce bien m'intéresse beaucoup.");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.property.findUnique as unknown as Mock).mockResolvedValue(PROPERTY);
  (prisma.contactRequest.create as unknown as Mock).mockResolvedValue({ id: "cr-1" });
  (verifyTurnstile as unknown as Mock).mockResolvedValue(true);
});

describe("createContactRequestAction — CAPTCHA (P2.8)", () => {
  it("crée la demande de contact quand le CAPTCHA passe", async () => {
    const res = await createContactRequestAction(undefined, formWith());

    expect(res).toEqual({ success: "Message envoyé !" });
    expect(prisma.contactRequest.create).toHaveBeenCalledTimes(1);
  });

  it("refuse la demande si le CAPTCHA échoue, avant toute écriture", async () => {
    (verifyTurnstile as unknown as Mock).mockResolvedValue(false);

    const res = await createContactRequestAction(undefined, formWith());

    expect(res).toEqual({ error: "Vérification anti-robot échouée. Veuillez réessayer." });
    expect(prisma.contactRequest.create).not.toHaveBeenCalled();
  });
});
