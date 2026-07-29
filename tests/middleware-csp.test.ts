/**
 * Tests — CSP par nonce posée par src/middleware.ts (P2.3 « Headers » et
 * « XSS stocké — régression CSP », ROADMAP.md, même artefact pour les deux :
 * une CSP stricte est la dernière ligne de défense si un contenu utilisateur
 * échappait un jour à l'échappement JSX par défaut de React).
 */
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function csp(path = "/sejours"): string {
  const res = middleware(new NextRequest(`http://localhost${path}`));
  const value = res.headers.get("Content-Security-Policy");
  expect(value).toBeTruthy();
  return value!;
}

describe("middleware — Content-Security-Policy", () => {
  it("pose les directives strictes attendues", () => {
    const value = csp();
    expect(value).toContain("default-src 'self'");
    expect(value).toContain("object-src 'none'");
    expect(value).toContain("frame-ancestors 'none'");
    expect(value).toContain("base-uri 'self'");
    expect(value).toContain("form-action 'self'");
  });

  it("inclut un nonce dans script-src, au format base64 attendu", () => {
    const value = csp();
    const match = value.match(/script-src[^;]*'nonce-([^']+)'/);
    expect(match).not.toBeNull();
    // Buffer.from(randomUUID()).toString("base64") → alphabet base64 standard.
    expect(match![1]).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it("génère un nonce différent à chaque requête (jamais réutilisé)", () => {
    const nonceOf = (value: string) => value.match(/'nonce-([^']+)'/)?.[1];
    const first = nonceOf(csp());
    const second = nonceOf(csp());
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first).not.toBe(second);
  });

  it("n'ouvre PAS challenges.cloudflare.com quand Turnstile est désactivé (défaut)", () => {
    const original = process.env.CAPTCHA_MODE;
    delete process.env.CAPTCHA_MODE;
    try {
      const value = csp();
      expect(value).not.toContain("challenges.cloudflare.com");
    } finally {
      if (original !== undefined) process.env.CAPTCHA_MODE = original;
    }
  });

  it("ouvre challenges.cloudflare.com UNIQUEMENT quand CAPTCHA_MODE=turnstile", () => {
    const original = process.env.CAPTCHA_MODE;
    process.env.CAPTCHA_MODE = "turnstile";
    try {
      const value = csp();
      expect(value).toContain("script-src");
      expect(value).toContain("https://challenges.cloudflare.com");
      expect(value).toContain("frame-src 'self' https://challenges.cloudflare.com");
    } finally {
      if (original === undefined) delete process.env.CAPTCHA_MODE;
      else process.env.CAPTCHA_MODE = original;
    }
  });
});
