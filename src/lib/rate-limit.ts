import { headers } from "next/headers";

/**
 * Rate limiting en mémoire (V0) : 5 tentatives / 15 minutes / IP
 * sur les actions sensibles (connexion, inscription, OTP).
 * En production : Redis ou équivalent.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "local"
  );
}

/** Retourne true si la tentative est autorisée, false si le quota est dépassé. */
export function checkRateLimit(action: string, ip: string): boolean {
  const key = `${action}:${ip}`;
  const nowMs = Date.now();

  // Nettoyage opportuniste des entrées périmées.
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
