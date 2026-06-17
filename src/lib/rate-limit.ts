import { headers } from "next/headers";
import { getRedis } from "@/lib/redis";
import { logStructured } from "@/lib/audit";

/**
 * Rate limiting : 5 tentatives / 15 minutes / IP sur les actions sensibles
 * (connexion, inscription, OTP).
 *
 * Deux modes, aiguillés par la présence de `REDIS_URL` :
 *   - **distribué** (Redis) : compteur partagé entre instances, survit aux
 *     redémarrages (fenêtre fixe atomique : INCR + PEXPIRE au premier hit).
 *   - **fallback in-memory** (Map) : mono-instance, suffisant pour la démo.
 * Si Redis tombe en cours de route, on retombe sur le compteur in-memory de
 * l'instance plutôt que de verrouiller les utilisateurs (dégradation gracieuse).
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
  const ip = await clientIp();
  const redis = getRedis();
  if (!redis) return checkRateLimit(action, ip);

  try {
    // Fenêtre fixe distribuée : INCR atomique ; le TTL n'est posé qu'au
    // premier hit (count === 1) pour ne pas réarmer la fenêtre à chaque essai.
    const key = `rl:${action}:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.pexpire(key, WINDOW_MS);
    return count <= MAX_ATTEMPTS;
  } catch (err) {
    logStructured("warn", "ratelimit.redis_fallback", {
      action,
      message: (err as Error).message,
    });
    return checkRateLimit(action, ip);
  }
}
