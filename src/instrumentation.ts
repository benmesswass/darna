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
