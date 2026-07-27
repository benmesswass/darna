import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-scrub";

/**
 * Init Sentry côté navigateur — LANCEMENT_ROADMAP.md §L4.2. Fichier détecté
 * automatiquement par Next.js 15 (remplace l'ancien sentry.client.config.ts).
 * No-op si NEXT_PUBLIC_SENTRY_DSN absent (défaut démo sûr). Tunnelé via
 * `/monitoring` (voir next.config.ts, option tunnelRoute) : les events
 * partent en POST same-origin plutôt que vers le domaine Sentry direct — la
 * CSP (`connect-src 'self'`, src/middleware.ts) n'a donc PAS besoin d'être
 * élargie à un domaine tiers.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    beforeSend: scrubSentryEvent,
  });
}

// Requis par le SDK pour instrumenter les navigations App Router (perf des
// transitions de route) — no-op si Sentry n'est pas initialisé ci-dessus.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
