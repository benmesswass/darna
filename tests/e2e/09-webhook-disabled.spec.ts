import { test, expect } from "@playwright/test";

/**
 * Complément à tests/api/webhook-konnect.spec.ts : le job E2E a Konnect
 * désactivé par défaut (PAYMENT_MODE non positionné à "konnect" — le
 * scénario 02 dépend du bouton paiement démo) — gratuit d'y tester la porte
 * "désactivé" plutôt que de complexifier le job `api` dédié.
 */
test("GET /api/payments/konnect/webhook → 404 quand Konnect est désactivé", async ({ request }) => {
  const res = await request.get("/api/payments/konnect/webhook?payment_ref=x&bid=y&sig=z");
  expect(res.status()).toBe(404);
  expect(await res.json()).toMatchObject({ error: "disabled" });
});
