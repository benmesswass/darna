import { headers } from "next/headers";

/**
 * Rate limiting en mémoire (V0) : 5 tentatives / 15 minutes / IP
 * sur les actions sensibles (connexion, inscription, OTP).
 *
 * IMPORTANT PRODUCTION : remplacer par Redis / Upstash :
 *   - l'in-memory Map ne survit pas aux redémarrages du process
 *   - en déploiement multi-instance (Vercel / k8s), chaque instance
 *     a son propre compteur → utiliser @upstash/ratelimit avec Redis.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export async function clientIp(): Promise<string> {
  const h = await headers();

  // Ordre de priorité : headers posés par le proxy de confiance (couche
  // infrastructure), jamais contrôlables par le client.
  //
  // • cf-connecting-ip  → IP réelle côté Cloudflare (non spoofable)
  // • x-real-ip         → posé par Vercel Edge ou Nginx avec
  //                        `proxy_set_header X-Real-IP $remote_addr`
  //
  // ⚠️  x-forwarded-for est INTENTIONNELLEMENT absent : un client peut
  //     injecter n'importe quelle valeur dans ce header, ce qui court-
  //     circuiterait complètement le rate limiting.
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

/** Retourne true si la tentative est autorisée, false si le quota est dépassé. */
export function checkRateLimit(action: string, ip: string): boolean {
  const key = `${action}:${ip}`;
  const nowMs = Date.now();

  // Nettoyage opportuniste des entrées périmées pour éviter la fuite mémoire.
  if (buckets.size > 1000) {
    for (const [k, b] of buckets) {
      if (b.resetAt < nowMs) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < nowMs) {
    buckets.set(key, { count: 1, resetAt: nowMs + WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_ATTEMPTS) return false;
  bucket.count += 1;
  return true;
}

export async function assertRateLimit(action: string): Promise<boolean> {
  return checkRateLimit(action, await clientIp());
}
