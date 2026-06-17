import { getRedis } from "@/lib/redis";
import { logStructured } from "@/lib/audit";

/**
 * Cache applicatif OPTIONNEL — Redis si `REDIS_URL`, sinon Map in-memory par
 * instance (TTL respecté). Réservé aux valeurs **JSON-sérialisables** et
 * lentes à changer (agrégats, indices). Dégradation gracieuse : toute erreur
 * Redis (lecture comme écriture) n'empêche jamais le calcul — on exécute `fn()`.
 *
 * Module SERVEUR uniquement.
 */
type Entry = { value: unknown; expiresAt: number };
const memory = new Map<string, Entry>();

/** Mémoïse le résultat de `fn` sous `key` pendant `ttlSeconds`. */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const redis = getRedis();

  if (redis) {
    try {
      const hit = await redis.get(key);
      if (hit !== null) return JSON.parse(hit) as T;
    } catch (err) {
      logStructured("warn", "cache.get_failed", { key, message: (err as Error).message });
    }
  } else {
    const hit = memory.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value as T;
  }

  const value = await fn();

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
      logStructured("warn", "cache.set_failed", { key, message: (err as Error).message });
    }
  } else {
    // Nettoyage opportuniste des entrées périmées (anti fuite mémoire, même
    // idiome que le rate limiting in-memory).
    if (memory.size > 500) {
      const now = Date.now();
      for (const [k, e] of memory) if (e.expiresAt <= now) memory.delete(k);
    }
    memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  return value;
}

/** Invalidation explicite (Redis + mémoire), best-effort. */
export async function cacheDelete(key: string): Promise<void> {
  memory.delete(key);
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(key);
    } catch {
      // best-effort : une invalidation ratée expirera via le TTL.
    }
  }
}
