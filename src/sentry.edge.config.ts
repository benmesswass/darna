import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-scrub";

/**
 * Init Sentry côté Edge (middleware, routes edge) — LANCEMENT_ROADMAP.md
 * §L4.2. Chargée par src/instrumentation.ts (`register()`, runtime "edge"
 * uniquement). No-op si SENTRY_DSN absent. Mêmes options que
 * sentry.server.config.ts (cohérence server/edge).
 */
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    beforeSend: scrubSentryEvent,
  });
}
