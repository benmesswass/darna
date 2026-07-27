import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-scrub";

/**
 * Init Sentry côté serveur (Node) — LANCEMENT_ROADMAP.md §L4.2. Chargée par
 * src/instrumentation.ts (`register()`, runtime "nodejs" uniquement). No-op
 * si SENTRY_DSN absent (défaut démo sûr, comme tous les modes du projet).
 */
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Free tier : 10 % des transactions échantillonnées, jamais plus.
    tracesSampleRate: 0.1,
    // Jamais de CIN/e-mail/téléphone envoyé à Sentry (breadcrumbs, message,
    // user, requête) — cf. src/lib/sentry-scrub.ts.
    beforeSend: scrubSentryEvent,
  });
}
