import { incrementWindowedCounter } from "@/lib/rate-limit";
import { logStructured } from "@/lib/audit";
import { captureError } from "@/lib/observability";
import { LOGIN_FAILURE_SPIKE_WINDOW_MINUTES, LOGIN_FAILURE_SPIKE_THRESHOLD } from "@/lib/config";

/**
 * Journalise un échec de connexion ET alimente le compteur de spike global
 * (LANCEMENT_ROADMAP.md §L4.3) — un volume anormal d'échecs sur une courte
 * fenêtre, tous utilisateurs/IP confondus, peut signaler une attaque
 * distribuée que le rate limiting par IP seul (src/lib/rate-limit.ts) ne
 * détecte pas. Alerte observabilité une seule fois par fenêtre (au
 * franchissement du seuil), pas à chaque échec suivant.
 *
 * Module SÉPARÉ de src/lib/auth.ts (et non une fonction interne) : importer
 * `next-auth` (via auth.ts) dans un test unitaire échoue systématiquement
 * (`next-auth/lib/env.js` → résolution `next/server` en échec, indépendant de
 * l'alias vitest.config.ts) — cf. tests/session-token-version.test.ts et
 * tests/permissions-gates.test.ts, qui mockent `@/lib/auth` entièrement pour
 * cette raison. Isoler cette logique ici la rend testable directement.
 */
export async function trackLoginFailure(meta: Record<string, unknown>): Promise<void> {
  logStructured("warn", "auth.login_failure", meta);
  const count = await incrementWindowedCounter(
    "global-login-failures",
    LOGIN_FAILURE_SPIKE_WINDOW_MINUTES * 60 * 1000
  );
  if (count === LOGIN_FAILURE_SPIKE_THRESHOLD) {
    await captureError(new Error("auth.login_failure_spike"), {
      count,
      windowMinutes: LOGIN_FAILURE_SPIKE_WINDOW_MINUTES,
    });
  }
}
