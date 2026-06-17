/**
 * Observabilité des erreurs — légère, sans SDK lourd (choix assumé vs
 * @sentry/nextjs). Edge-safe : `console` + `fetch` uniquement, aucune
 * dépendance serveur (pas de prisma) → utilisable depuis instrumentation.
 *
 * - TOUJOURS : log structuré JSON (même forme que logStructured), consommable
 *   par Logtail / Axiom / un relais Sentry.
 * - OPT-IN : POST fire-and-forget vers `OBSERVABILITY_WEBHOOK_URL` si défini.
 *   Une erreur d'envoi n'impacte jamais le flux applicatif.
 */
export async function captureError(
  error: unknown,
  context: Record<string, unknown> = {}
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  const entry = {
    ts: new Date().toISOString(),
    level: "error" as const,
    event: "app.exception",
    message: err.message,
    stack: err.stack,
    ...context,
  };

  console.error(JSON.stringify(entry));

  const url = process.env.OBSERVABILITY_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entry),
      cache: "no-store",
    });
  } catch {
    // L'observabilité ne doit jamais casser le flux ni masquer l'erreur initiale.
  }
}
