/**
 * Connexion Google (LANCEMENT_ROADMAP.md §L8.2) — intégration OPTIONNELLE, sur
 * le modèle Turnstile/Sentry : sans les deux clés, `isGoogleAuthEnabled()`
 * renvoie `false` et seul le provider credentials est proposé. Les deux
 * variables sont exigées ENSEMBLE au boot (cf. src/lib/env.ts).
 *
 * ⚠️  Module SERVEUR uniquement (lit GOOGLE_CLIENT_SECRET).
 */
export function isGoogleAuthEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
