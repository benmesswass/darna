import { test, expect } from "@playwright/test";

/**
 * P2.3 (ROADMAP.md) — headers de sécurité statiques posés par next.config.ts
 * (`securityHeaders`). Invocation HTTP réelle (pas d'import direct) : ce sont
 * des headers appliqués par le serveur Next.js lui-même, pas par une fonction
 * appelable — seule une vraie requête les révèle.
 *
 * `upgrade-insecure-requests` (CSP, src/middleware.ts) n'est PAS testé ici :
 * conditionné à NODE_ENV=production, absent sous `npm run dev`.
 */
test.describe("Headers de sécurité (next.config.ts)", () => {
  test("HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy sont présents", async ({
    request,
  }) => {
    const res = await request.get("/");
    const headers = res.headers();

    expect(headers["strict-transport-security"]).toBe(
      "max-age=63072000; includeSubDomains; preload"
    );
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toBe(
      "camera=(), microphone=(), geolocation=()"
    );
    // poweredByHeader: false (next.config.ts) — ne révèle pas la stack.
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("la CSP (src/middleware.ts) est présente sur la même réponse", async ({ request }) => {
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toMatch(/script-src[^;]*'nonce-[^']+'/);
  });
});
