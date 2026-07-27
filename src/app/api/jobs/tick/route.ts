import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logStructured } from "@/lib/audit";
import { runJobs } from "@/lib/jobs/runner";

/**
 * Socle scheduler (LANCEMENT_ROADMAP.md §L3.1) — appelé par Vercel Cron
 * toutes les 15 min (`vercel.json`), qui envoie automatiquement
 * `Authorization: Bearer ${CRON_SECRET}` quand la variable existe côté
 * projet Vercel. En dev/local : `CRON_SECRET` dans `.env`, puis
 * `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/jobs/tick`
 * (voir `.env.example`).
 *
 * Lecture directe de `process.env` (pas le singleton `env` de src/lib/env.ts,
 * parsé une seule fois au boot) — même patron que src/lib/turnstile.ts, pour
 * rester relisible en test sans redémarrer le process.
 */
function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(header);
  // timingSafeEqual exige des longueurs égales : on court-circuite sinon (la
  // comparaison de longueur ne fuit pas le secret, seulement le format).
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    logStructured("warn", "job.tick.unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await runJobs();
  return NextResponse.json({ ranAt: new Date().toISOString(), results });
}
