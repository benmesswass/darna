/**
 * Tests — verifyTurnstile : dual-mode + fail-closed.
 * Désactivé (défaut) → laisse passer sans appel réseau. Activé → ne valide que
 * sur confirmation explicite de Cloudflare ; bloque dans tous les autres cas.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isCaptchaEnabled, verifyTurnstile } from "@/lib/turnstile";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.restoreAllMocks();
  delete process.env.CAPTCHA_MODE;
  delete process.env.TURNSTILE_SECRET_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("verifyTurnstile — CAPTCHA désactivé (démo)", () => {
  it("laisse passer sans token ni appel réseau", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    expect(isCaptchaEnabled()).toBe(false);
    await expect(verifyTurnstile(null)).resolves.toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("verifyTurnstile — CAPTCHA actif (turnstile)", () => {
  beforeEach(() => {
    process.env.CAPTCHA_MODE = "turnstile";
    process.env.TURNSTILE_SECRET_KEY = "secret";
  });

  it("refuse si le token est absent (sans appeler Cloudflare)", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    await expect(verifyTurnstile(null)).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuse si le secret n'est pas configuré (fail-closed)", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    await expect(verifyTurnstile("tok")).resolves.toBe(false);
  });

  it("valide quand Cloudflare confirme le token", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    await expect(verifyTurnstile("tok")).resolves.toBe(true);
  });

  it("refuse quand Cloudflare rejette le token", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: false }), { status: 200 })
    );
    await expect(verifyTurnstile("tok")).resolves.toBe(false);
  });

  it("refuse en cas d'erreur réseau (fail-closed)", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network"));
    await expect(verifyTurnstile("tok")).resolves.toBe(false);
  });
});
