import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

// ROADMAP.md §P4.1 — ANALYZE=true npm run build. Dev-only, no-op sinon.
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

// Nonces CSP sont gérés par src/middleware.ts (générés par requête).
// Ce fichier positionne les headers statiques qui ne nécessitent pas de nonce.
const securityHeaders = [
  // HSTS : force HTTPS pour 2 ans, inclut sous-domaines, eligible preload
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissions Browser API
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Upload de photos d'annonces : 8 photos max, compressées côté client
      // (~400 Ko chacune) — 10 Mo couvre largement un lot avec marge.
      bodySizeLimit: "10mb",
    },
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // AVIF essayé en premier (meilleure compression), repli WebP puis JPEG
    // d'origine selon le support navigateur (négociation via Accept).
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // §L9.2 : le navigateur revérifie déjà /sw.js au moins une fois par
      // jour de lui-même, mais no-cache évite qu'un Cache-Control par défaut
      // trop long ne retarde la propagation d'une mise à jour du SW.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
  // Désactive le header X-Powered-By (ne pas exposer la stack)
  poweredByHeader: false,
};

// LANCEMENT_ROADMAP.md §L4.2 — no-op sans SENTRY_DSN (aucun build-time
// upload de source maps tenté : org/project/authToken volontairement absents
// tant que le projet Sentry n'existe pas, cf. ⛔ W8 ; à compléter une fois le
// DSN réel obtenu). tunnelRoute proxie les events via /monitoring (same-
// origin) — pas besoin d'élargir la CSP à un domaine tiers pour autant
// (connect-src 'self' suffit déjà, cf. src/middleware.ts).
export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  silent: true,
  tunnelRoute: "/monitoring",
});
