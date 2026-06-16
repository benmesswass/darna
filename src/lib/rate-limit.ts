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
  // Les en-têtes d'IP (cf-connecting-ip / x-real-ip) ne sont fiables QUE
  // derrière un proxy de confiance qui les pose lui-même. Hors de ce cas, ils
  // sont librement spoofables par le client → on refuse de les lire (sinon
  // contournement trivial du rate limiting). À activer en prod via
  // TRUSTED_PROXY="true" derrière Vercel / Cloudflare / Nginx.
  if (process.env.TRUSTED_PROXY !== "true") {
    return "untrusted";
  }

  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? "unknown";
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
