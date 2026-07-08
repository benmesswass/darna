/**
 * Identifiants et slugs FIXES des données seedées par global-setup.ts.
 * Partagés avec les specs (qui re-questionnent Prisma par ces clés stables
 * plutôt que de recevoir un état passé en mémoire entre processus).
 *
 * `hostCancel` et `travelerNoShow` sont des comptes JETABLES, dédiés à un seul
 * scénario chacun (06 et 05) : ces deux scénarios SUSPENDENT le compte qu'ils
 * manipulent (`applySuspension`) — les isoler évite qu'un scénario dégrade un
 * compte partagé (`host`/`traveler-a`) pendant qu'un autre spec s'en sert en
 * parallèle (`fullyParallel: true`).
 */
export const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "e2e-ci-only-dummy-password-2026";

export const E2E_USERS = {
  host: { id: "e2e-host", email: "e2e-host@darna.tn", role: "HOTE" },
  hostCancel: { id: "e2e-host-cancel", email: "e2e-host-cancel@darna.tn", role: "HOTE" },
  travelerA: { id: "e2e-traveler-a", email: "e2e-traveler-a@darna.tn", role: "VOYAGEUR" },
  travelerB: { id: "e2e-traveler-b", email: "e2e-traveler-b@darna.tn", role: "VOYAGEUR" },
  // Jamais connecté via l'UI (aucun test ne pilote ce rôle directement) —
  // seul son id sert de `guestId` à la réservation cash pré-seedée.
  travelerNoShow: { id: "e2e-traveler-noshow", email: "e2e-traveler-noshow@darna.tn", role: "VOYAGEUR" },
} as const;

/** Un slug dédié par scénario réservant réellement — évite toute interférence
 * entre specs qui tournent en parallèle (`fullyParallel: true`). */
export const E2E_PROPERTY_SLUGS = {
  booking: "e2e-stay-booking",
  double: "e2e-stay-double",
  cash: "e2e-stay-cash",
  idor: "e2e-stay-idor",
  cancel: "e2e-stay-cancel",
} as const;

export const E2E_PREFIX = "e2e-";
