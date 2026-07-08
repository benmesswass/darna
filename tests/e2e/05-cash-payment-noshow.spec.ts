import { test, expect } from "./fixtures";
import { prisma } from "../../src/lib/prisma";
import { fr } from "@/lib/i18n/fr";
import { E2E_PROPERTY_SLUGS, E2E_USERS } from "./seed-data";

/**
 * La demande (guest → EN_ATTENTE_ACCEPTATION) est pré-seedée avec un checkIn
 * au PASSÉ (global-setup.ts) — nécessaire pour tester le no-show immédiatement,
 * impossible à obtenir via le calendrier UI (dates passées désactivées). Ce
 * scénario exerce donc réellement les deux étapes qui comptent : acceptation
 * hôte et signalement d'absence.
 */
test("paiement sur place : acceptation hôte puis no-show", async ({ hostPage }) => {
  const property = await prisma.property.findUniqueOrThrow({
    where: { slug: E2E_PROPERTY_SLUGS.cash },
  });
  const booking = await prisma.booking.findFirstOrThrow({
    where: { propertyId: property.id, status: "EN_ATTENTE_ACCEPTATION" },
  });

  await hostPage.goto("/dashboard/demandes");
  await hostPage.getByRole("button", { name: fr.dashboard.accepterDemande }).click();

  await expect
    .poll(async () => {
      const b = await prisma.booking.findUnique({ where: { id: booking.id } });
      return b?.status;
    })
    .toBe("CONFIRMEE");

  const invoice = await prisma.hostInvoice.findUnique({ where: { bookingId: booking.id } });
  expect(invoice).not.toBeNull();
  expect(invoice?.amount).toBe(booking.serviceFee);

  await hostPage.goto("/dashboard/reservations");
  await hostPage.getByRole("button", { name: fr.dashboard.signalerNoShow }).click();
  await hostPage.getByRole("button", { name: fr.dashboard.noShowConfirmer }).click();

  await expect
    .poll(async () => {
      const b = await prisma.booking.findUnique({ where: { id: booking.id } });
      return b?.status;
    })
    .toBe("TERMINEE");

  const traveler = await prisma.user.findUniqueOrThrow({
    where: { id: E2E_USERS.travelerNoShow.id },
  });
  expect(traveler.suspended).toBe(true);
});
