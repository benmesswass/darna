import type { NextConfig } from "next";

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
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Désactive le header X-Powered-By (ne pas exposer la stack)
  poweredByHeader: false,
};

export default nextConfig;
