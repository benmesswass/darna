import { test, expect } from "./fixtures";
import * as allure from "allure-js-commons";
import { prisma } from "../../src/lib/prisma";
import { fr } from "@/lib/i18n/fr";
import { E2E_PROPERTY_SLUGS } from "./seed-data";
import { selectStayDates } from "./helpers";

test("recherche → annonce → réservation → paiement simulé → confirmation → avis", async ({
  travelerAPage: page,
}) => {
  await allure.epic("Réservation");
  await allure.feature("Parcours réservation");
  await allure.story("Un voyageur réserve, paie (simulé) et laisse un avis après le séjour");

  const slug = E2E_PROPERTY_SLUGS.booking;

  await allure.step("Rechercher l'annonce depuis /sejours", async () => {
    await page.goto("/sejours");
    await page.locator(`a[href*="${slug}"]`).first().click();
    await page.waitForURL((url) => url.pathname.includes(`/annonce/${slug}`));
  });

  await allure.step("Sélectionner les dates et soumettre la demande de réservation", async () => {
    await page.goto(`/annonce/${slug}/reserver`);
    await selectStayDates(page);
    await page.getByRole("button", { name: fr.booking.continuerPaiement }).click();
    await page.waitForURL((url) => url.pathname.startsWith("/reservation/"));
  });

  const bookingId = page.url().match(/\/reservation\/([^/]+)\/paiement/)?.[1];
  expect(bookingId).toBeTruthy();

  await allure.step("Payer (mode simulé — PAYMENT_MODE=demo, pas de Konnect réel)", async () => {
    await page.getByRole("button", { name: fr.booking.payerSimulation }).click();
    await expect
      .poll(async () => {
        const b = await prisma.booking.findUnique({ where: { id: bookingId! } });
        return b?.status;
      })
      .toBe("CONFIRMEE");
  });

  await allure.step("Avancer le séjour au passé (fin de séjour simulée en base)", async () => {
    // Avis : n'est éligible qu'après le séjour (checkOut < now). On avance le
    // temps par la base plutôt que d'attendre un vrai séjour (même esprit que
    // `ymd()` dans tests/integration/helpers.ts).
    await prisma.booking.update({
      where: { id: bookingId! },
      data: {
        checkIn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: "TERMINEE",
      },
    });
  });

  await allure.step("Publier un avis sur le séjour", async () => {
    await page.goto(`/annonce/${slug}#avis`);
    const reviewSection = page.locator("#avis");
    const comment = "Séjour très agréable, hôte réactif.";
    await reviewSection.locator('textarea[name="comment"]').fill(comment);
    await reviewSection.getByRole("button", { name: fr.common.envoyer }).click();
    // Le formulaire disparaît après revalidation (l'avis publié rejoint la
    // liste) — on n'attend donc pas son message de succès transitoire, mais
    // l'avis lui-même désormais affiché.
    await expect(page.getByText(comment)).toBeVisible();

    await expect
      .poll(async () => {
        const b = await prisma.booking.findUnique({ where: { id: bookingId! }, select: { review: true } });
        return Boolean(b?.review);
      })
      .toBe(true);
  });
});
