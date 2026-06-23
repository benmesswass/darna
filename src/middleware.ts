import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de sécurité — deux responsabilités :
 * 1. Génère un nonce cryptographique par requête et l'injecte dans la CSP.
 *    Next.js App Router lit automatiquement le header `x-nonce` pour ses
 *    propres scripts d'hydratation.
 * 2. Applique la CSP via le header de réponse (defense-in-depth par rapport
 *    aux headers statiques de next.config.ts).
 *
 * 'unsafe-inline' est conservé pour style-src (Tailwind v4 injecte des <style>
 * inline). Pour script-src, 'unsafe-inline' est neutralisé par 'strict-dynamic'
 * sur les navigateurs modernes qui supportent les deux.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const isProd = process.env.NODE_ENV === "production";

  // CAPTCHA Cloudflare Turnstile (cf. src/lib/turnstile.ts) : on n'élargit la CSP
  // aux domaines challenges.cloudflare.com QUE lorsque le mode est actif — la CSP
  // reste donc stricte en démo. Le widget charge un script (autorisé par
  // strict-dynamic via le nonce), pose une iframe (frame-src) et appelle
  // Cloudflare (connect-src).
  const captchaOn = process.env.CAPTCHA_MODE === "turnstile";
  const cf = "https://challenges.cloudflare.com";

  const csp = [
    "default-src 'self'",
    // 'strict-dynamic' + nonce : les navigateurs modernes ignorent 'unsafe-inline'
    // quand strict-dynamic est présent. Rétrocompatibilité IE : 'unsafe-inline' est
    // conservé en fallback pour les navigateurs qui ne supportent pas les nonces.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'${captchaOn ? ` ${cf}` : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
    "font-src 'self' data:",
    `connect-src 'self' https://*.tile.openstreetmap.org${captchaOn ? ` ${cf}` : ""}`,
    ...(captchaOn ? [`frame-src 'self' ${cf}`] : []),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Force HTTPS pour toutes les ressources en production
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  // x-nonce est lu par Next.js App Router pour ses propres <script>
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Header de réponse : appliqué au navigateur
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    // Exclut les assets statiques et les routes internes Next.js
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
