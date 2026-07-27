/**
 * Hook de démarrage Next.js — valide les variables d'environnement au boot
 * (fail-fast) et initialise Sentry (LANCEMENT_ROADMAP.md §L4.2, actif
 * seulement si SENTRY_DSN défini — no-op sinon). L'import dynamique garantit
 * que ça ne s'exécute qu'au runtime serveur (jamais au build) et charge la
 * config adaptée au runtime (Node vs Edge — cf. sentry.server.config.ts /
 * sentry.edge.config.ts, deux entrées distinctes attendues par le SDK).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/env");
    await import("./sentry.server.config");
  } else if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

type RequestErrorContext = {
  routerKind: "Pages Router" | "App Router";
  routePath: string;
  routeType: "render" | "route" | "action" | "middleware";
  renderSource?: "react-server-components" | "react-server-components-payload" | "server-rendering";
  revalidateReason: "on-demand" | "stale" | undefined;
};

/**
 * Hook natif Next.js : capture TOUTES les erreurs serveur (RSC, route handlers,
 * server actions) en un point unique. Alimente TOUJOURS le suivi léger
 * existant (captureError → OBSERVABILITY_WEBHOOK_URL), et EN PLUS Sentry si
 * configuré — les deux sont indépendants, jamais l'un à la place de l'autre.
 * Import dynamique : ne charge chaque module qu'au moment d'une erreur.
 */
export async function onRequestError(
  error: unknown,
  request: Readonly<{ path: string; method: string; headers: NodeJS.Dict<string | string[]> }>,
  context: Readonly<RequestErrorContext>
): Promise<void> {
  const { captureError } = await import("./lib/observability");
  await captureError(error, {
    path: request?.path,
    method: request?.method,
    routePath: context?.routePath,
    routerKind: context?.routerKind,
  });

  if (process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureRequestError(error, request, context);
  }
}
