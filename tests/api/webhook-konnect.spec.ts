import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { signKonnectWebhook } from "@/lib/konnect";
import { prisma } from "@/lib/prisma";
import { createUser, createStayProperty, cleanupByPrefix } from "../integration/helpers";

/**
 * Tests HTTP réels de /api/payments/konnect/webhook (webhook voyageur) —
 * aucun test au niveau route n'existait avant (contrairement à sa jumelle
 * host-invoice-webhook, déjà couverte par tests/host-invoice-webhook.test.ts).
 *
 * Konnect est actif sur ce serveur (playwright.api.config.ts, PAYMENT_MODE=
 * konnect) — nécessaire pour dépasser la porte `isKonnectEnabled()` et
 * atteindre les portes suivantes (signature, rate-limit). Le cas "désactivé
 * → 404" est testé séparément dans tests/e2e/09-webhook-disabled.spec.ts
 * (gratuit, le job E2E a déjà Konnect désactivé par défaut).
 *
 * Le succès de règlement réel (montant correct, `getKonnectPayment` sortant)
 * reste hors périmètre ici — appellerait la vraie API sandbox Konnect sans
 * identifiants réels. Déjà couvert par les tests Vitest mockés existants
 * (`tests/payments.test.ts`).
 */
const PREFIX = "api-webhook-konnect";

test.afterAll(async () => {
  await cleanupByPrefix(PREFIX);
  await prisma.$disconnect();
});

test.describe("GET /api/payments/konnect/webhook", () => {
  test("payment_ref manquant → 400", async ({ request }) => {
    const bid = randomUUID();
    const sig = signKonnectWebhook(bid);
    const res = await request.get(`/api/payments/konnect/webhook?bid=${bid}&sig=${sig}`);
    expect(res.status()).toBe(400);
  });

  test("signature absente → 401", async ({ request }) => {
    const bid = randomUUID();
    const res = await request.get(`/api/payments/konnect/webhook?payment_ref=ref-${bid}&bid=${bid}`);
    expect(res.status()).toBe(401);
  });

  test("signature invalide → 401", async ({ request }) => {
    const bid = randomUUID();
    const res = await request.get(
      `/api/payments/konnect/webhook?payment_ref=ref-${bid}&bid=${bid}&sig=not-a-valid-signature`
    );
    expect(res.status()).toBe(401);
  });

  test("référence inconnue (signature valide) → 200 INTROUVABLE", async ({ request }) => {
    const bid = randomUUID();
    const sig = signKonnectWebhook(bid);
    const res = await request.get(`/api/payments/konnect/webhook?payment_ref=ref-${bid}&bid=${bid}&sig=${sig}`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ received: true, result: "INTROUVABLE" });
  });

  test("rejeu idempotent (déjà CONFIRMEE) → 200 CONFIRMEE les deux fois, sans mutation", async ({ request }) => {
    const user = await createUser(PREFIX);
    const property = await createStayProperty(PREFIX, user.id);
    const booking = await prisma.booking.create({
      data: {
        propertyId: property.id,
        guestId: user.id,
        checkIn: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
        nightlyPrice: 200,
        serviceFee: 20,
        totalPrice: 420,
        amountPaid: 420,
        status: "CONFIRMEE",
        paidAt: new Date(),
      },
    });
    const sig = signKonnectWebhook(booking.id);
    const url = `/api/payments/konnect/webhook?payment_ref=ref-${booking.id}&bid=${booking.id}&sig=${sig}`;

    const first = await request.get(url);
    expect(first.status()).toBe(200);
    expect(await first.json()).toMatchObject({ received: true, result: "CONFIRMEE" });

    const second = await request.get(url);
    expect(second.status()).toBe(200);
    expect(await second.json()).toMatchObject({ received: true, result: "CONFIRMEE" });

    const unchanged = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(unchanged.status).toBe("CONFIRMEE");
    expect(unchanged.amountPaid).toBe(420);
  });

  test("martèlement (6 appels sur le même bid signé) → 429 au 6ᵉ", async ({ request }) => {
    const bid = randomUUID();
    const sig = signKonnectWebhook(bid);
    const url = `/api/payments/konnect/webhook?payment_ref=ref-${bid}&bid=${bid}&sig=${sig}`;

    for (let i = 0; i < 5; i++) {
      const res = await request.get(url);
      expect(res.status()).toBe(200);
    }
    const sixth = await request.get(url);
    expect(sixth.status()).toBe(429);
  });
});
