import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { paymentMode } from "@/lib/modes";
import { logStructured } from "@/lib/audit";

/**
 * Endpoint de santé (LANCEMENT_ROADMAP.md §L4.1) — cible d'un monitoring
 * d'uptime externe (UptimeRobot/Better Stack). Public, sans authentification
 * (c'est le point) : ne renvoie donc JAMAIS de secret ni de détail de version,
 * uniquement des booléens + le mode paiement actif (déjà public via le
 * comportement observable du site, pas une fuite d'information).
 */
export async function GET() {
  let db = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    db = false;
    logStructured("error", "health.db_check_failed", { error: (err as Error).message });
  }

  let redis: boolean | null = null;
  const client = getRedis();
  if (client) {
    try {
      await client.ping();
      redis = true;
    } catch (err) {
      redis = false;
      logStructured("error", "health.redis_check_failed", { error: (err as Error).message });
    }
  }

  const ok = db && redis !== false;

  return NextResponse.json(
    { ok, db, redis, mode: paymentMode() },
    { status: ok ? 200 : 503 }
  );
}
