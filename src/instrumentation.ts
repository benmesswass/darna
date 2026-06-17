/**
 * Hook de démarrage Next.js — valide les variables d'environnement au boot
 * (fail-fast). L'import dynamique garantit que la validation ne s'exécute qu'au
 * runtime serveur (jamais au build) et uniquement côté Node.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/env");
  }
}

/**
 * Hook natif Next.js : capture TOUTES les erreurs serveur (RSC, route handlers,
 * server actions) en un point unique → observabilité légère (cf. observability).
 * Import dynamique : ne charge le module qu'au moment d'une erreur.
 */
export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: { routePath?: string; routerKind?: string }
): Promise<void> {
  const { captureError } = await import("./lib/observability");
  await captureError(error, {
    path: request?.path,
    method: request?.method,
    routePath: context?.routePath,
    routerKind: context?.routerKind,
  });
}
