import { test, expect } from "./fixtures";
import { prisma } from "../../src/lib/prisma";
import { fr } from "@/lib/i18n/fr";
import { E2E_PROPERTY_SLUGS } from "./seed-data";
import { selectStayDates } from "./helpers";

test("recherche → annonce → réservation → paiement simulé → confirmation → avis", async ({
  travelerAPage: page,
}) => {
  const slug = E2E_PROPERTY_SLUGS.booking;

  // Recherche → annonce (on ne re-teste pas les filtres de /sejours ici, déjà
  // couverts par ailleurs — on vérifie que le résultat mène bien à l'annonce).
  await page.goto("/sejours");
  await page.locator(`a[href*="${slug}"]`).first().click();
  await page.waitForURL((url) => url.pathname.includes(`/annonce/${slug}`));

  // Annonce → réservation
  await page.goto(`/annonce/${slug}/reserver`);
  await selectStayDates(page);
  await page.getByRole("button", { name: fr.booking.continuerPaiement }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/reservation/"));

  // Paiement simulé (PAYMENT_MODE=demo, valeur par défaut — pas de Konnect réel)
  await page.getByRole("button", { name: fr.booking.payerSimulation }).click();

  const bookingId = page.url().match(/\/reservation\/([^/]+)\/paiement/)?.[1];
  expect(bookingId).toBeTruthy();

  await expect
    .poll(async () => {
      const b = await prisma.booking.findUnique({ where: { id: bookingId! } });
      return b?.status;
    })
    .toBe("CONFIRMEE");

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
