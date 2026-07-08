import { test, expect } from "./fixtures";
import * as allure from "allure-js-commons";
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
  await allure.epic("Paiement");
  await allure.feature("Paiement sur place (Rail 2)");
  await allure.story("L'hôte accepte une demande cash puis signale l'absence du voyageur");

  const booking = await allure.step("Retrouver la demande cash en attente d'acceptation", async () => {
    const property = await prisma.property.findUniqueOrThrow({
      where: { slug: E2E_PROPERTY_SLUGS.cash },
    });
    return prisma.booking.findFirstOrThrow({
      where: { propertyId: property.id, status: "EN_ATTENTE_ACCEPTATION" },
    });
  });

  await allure.step("Accepter la demande de paiement sur place", async () => {
    await hostPage.goto("/dashboard/demandes");
    await hostPage.getByRole("button", { name: fr.dashboard.accepterDemande }).click();
    await expect
      .poll(async () => {
        const b = await prisma.booking.findUnique({ where: { id: booking.id } });
        return b?.status;
      })
      .toBe("CONFIRMEE");
  });

  await allure.step("Vérifier la facture de commission générée pour l'hôte", async () => {
    const invoice = await prisma.hostInvoice.findUnique({ where: { bookingId: booking.id } });
    expect(invoice).not.toBeNull();
    expect(invoice?.amount).toBe(booking.serviceFee);
  });

  await allure.step("Signaler l'absence du voyageur", async () => {
    await hostPage.goto("/dashboard/reservations");
    await hostPage.getByRole("button", { name: fr.dashboard.signalerNoShow }).click();
    await hostPage.getByRole("button", { name: fr.dashboard.noShowConfirmer }).click();
    await expect
      .poll(async () => {
        const b = await prisma.booking.findUnique({ where: { id: booking.id } });
        return b?.status;
      })
      .toBe("TERMINEE");
  });

  await allure.step("Vérifier la suspension du voyageur", async () => {
    const traveler = await prisma.user.findUniqueOrThrow({
      where: { id: E2E_USERS.travelerNoShow.id },
    });
    expect(traveler.suspended).toBe(true);
  });
});
