import { test, expect } from "./fixtures";
import { prisma } from "../../src/lib/prisma";
import { E2E_PROPERTY_SLUGS, E2E_USERS } from "./seed-data";

/**
 * Périmètre : IDOR sur la page de paiement d'une réservation (voyageur A vs
 * voyageur B), le cas d'usage principal cité par la roadmap. L'IDOR facture
 * (hôte A vs hôte B) est déjà couverte au niveau intégration
 * (tests/host-invoice-payment.test.ts) — pas dupliquée ici.
 */
test("IDOR : un voyageur ne peut pas ouvrir la réservation d'un autre", async ({ travelerBPage }) => {
  const property = await prisma.property.findUniqueOrThrow({
    where: { slug: E2E_PROPERTY_SLUGS.idor },
  });
  const booking = await prisma.booking.findFirstOrThrow({
    where: { propertyId: property.id, guestId: E2E_USERS.travelerA.id },
  });

  const response = await travelerBPage.goto(`/reservation/${booking.id}/paiement`);
  expect(response?.status()).toBe(404);
});
