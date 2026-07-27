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

type Counter = { count: number; resetAt: number };
const counters = new Map<string, Counter>();

export async function clientIp(): Promise<string> {
  // CAS PROD SÉCURISÉ — derrière un proxy de confiance qui POSE lui-même
  // l'en-tête d'IP (Cloudflare / Nginx / Vercel). C'est la seule configuration
  // où ces en-têtes sont dignes de confiance. Activé via TRUSTED_PROXY="true".
  // En production réelle, src/lib/env.ts EXIGE ce réglage (fail-fast au boot).
  if (process.env.TRUSTED_PROXY === "true") {
    const h = await headers();
    return h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? "unknown";
  }

  // CAS DÉVELOPPEMENT — pas de frontière de sécurité en local : on lit l'en-tête
  // best-effort pour que le rate limiting fonctionne par client, sinon un
  // identifiant fixe « dev-local ». On NE retombe PAS sur un bucket global ici.
  if (process.env.NODE_ENV !== "production") {
    const h = await headers();
    return (
      h?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h?.get("x-real-ip") ||
      "dev-local"
    );
  }

  // CAS PROD SANS PROXY DE CONFIANCE — on REFUSE de lire des en-têtes spoofables
  // (sinon contournement trivial). Bucket commun « untrusted » assumé : ce
  // chemin ne doit exister qu'en démo, où env.ts laisse passer mais avertit.
  // Un lancement public réel est bloqué au boot tant que TRUSTED_PROXY≠"true".
  return "untrusted";
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

/**
 * Rate limit générique sur une clé arbitraire (IP, payment_ref…). Distribué si
 * Redis, sinon in-memory. C'est le primitif partagé ; `assertRateLimit` n'en est
 * qu'un cas particulier (clé = IP du client).
 */
export async function rateLimit(action: string, key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return checkRateLimit(action, key);

  try {
    // Fenêtre fixe distribuée : INCR atomique ; le TTL n'est posé qu'au
    // premier hit (count === 1) pour ne pas réarmer la fenêtre à chaque essai.
    const redisKey = `rl:${action}:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.pexpire(redisKey, WINDOW_MS);
    return count <= MAX_ATTEMPTS;
  } catch (err) {
    logStructured("warn", "ratelimit.redis_fallback", {
      action,
      message: (err as Error).message,
    });
    return checkRateLimit(action, key);
  }
}

export async function assertRateLimit(action: string): Promise<boolean> {
  return rateLimit(action, await clientIp());
}

/**
 * Compteur fenêtré générique (LANCEMENT_ROADMAP.md §L4.3 — détection de spike,
 * ex. échecs de connexion) — incrémente et retourne le nombre de hits dans la
 * fenêtre `windowMs`, SANS seuil de blocage (contrairement à `rateLimit`) :
 * c'est à l'appelant de décider du seuil d'alerte. Même dualité Redis
 * (distribué, compteur partagé entre instances)/in-memory (fallback) que
 * `rateLimit`, mais fenêtre et espace de clés propres à l'appelant (préfixe
 * `wc:` distinct de `rl:` — objectif différent : compter, pas limiter).
 */
export async function incrementWindowedCounter(key: string, windowMs: number): Promise<number> {
  const redis = getRedis();
  if (redis) {
    try {
      const redisKey = `wc:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) await redis.pexpire(redisKey, windowMs);
      return count;
    } catch (err) {
      logStructured("warn", "windowed_counter.redis_fallback", {
        key,
        message: (err as Error).message,
      });
      // Tombe sur le fallback in-memory ci-dessous.
    }
  }

  const nowMs = Date.now();
  const counter = counters.get(key);
  if (!counter || counter.resetAt < nowMs) {
    counters.set(key, { count: 1, resetAt: nowMs + windowMs });
    return 1;
  }
  counter.count += 1;
  return counter.count;
}
