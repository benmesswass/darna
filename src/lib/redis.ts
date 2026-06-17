import Redis from "ioredis";
import { logStructured } from "@/lib/audit";

/**
 * Client Redis OPTIONNEL — opt-in via `REDIS_URL`.
 *
 * Absent ⇒ `getRedis()` renvoie `null` et les consommateurs (rate limiting
 * distribué, cache applicatif) retombent sur leur implémentation in-memory
 * mono-instance. La démo (pas de `REDIS_URL`) ne se connecte donc jamais.
 *
 * Dégradation gracieuse : `enableOfflineQueue: false` + `maxRetriesPerRequest`
 * bas → si Redis est injoignable, les commandes échouent VITE et les appelants
 * retombent sur le fallback plutôt que de bloquer la requête.
 *
 * Module SERVEUR uniquement.
 */
const globalForRedis = globalThis as unknown as { redis?: Redis | null };

function create(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  // Ne jamais laisser une erreur de connexion Redis crasher le process.
  client.on("error", (err: Error) => {
    logStructured("error", "redis.error", { message: err.message });
  });
  return client;
}

/** Instance Redis partagée (singleton, survit au HMR), ou null si non configuré. */
export function getRedis(): Redis | null {
  if (globalForRedis.redis === undefined) {
    globalForRedis.redis = create();
  }
  return globalForRedis.redis ?? null;
}
