import { test, expect } from "./fixtures";
import { prisma } from "../../src/lib/prisma";
import { fr } from "@/lib/i18n/fr";
import { E2E_PROPERTY_SLUGS } from "./seed-data";
import { selectStayDates } from "./helpers";

/**
 * Miroir E2E de tests/integration/booking-concurrency.integration.test.ts :
 * 2 voyageurs, même créneau, 2 onglets — un seul gagne.
 *
 * L'assertion porte sur l'état FINAL en base (invariant métier), pas sur
 * `page.url()` post-clic : sous forte charge parallèle (plusieurs specs +
 * compilations Turbopack simultanées), le timing des 2 clics et des
 * navigations qui suivent devient bruyant — le vrai invariant à prouver
 * (jamais 2 réservations actives sur le même créneau) est robuste à ce bruit,
 * la navigation UI ne l'est pas.
 */
test("double-réservation via 2 onglets : un seul voyageur gagne", async ({
  travelerAPage,
  travelerBPage,
}) => {
  const slug = E2E_PROPERTY_SLUGS.double;

  for (const page of [travelerAPage, travelerBPage]) {
    await page.goto(`/annonce/${slug}/reserver`);
    await selectStayDates(page);
  }

  const submitButton = (page: typeof travelerAPage) =>
    page.getByRole("button", { name: fr.booking.continuerPaiement });

  await Promise.all([submitButton(travelerAPage).click(), submitButton(travelerBPage).click()]);

  const property = await prisma.property.findUniqueOrThrow({ where: { slug } });
  await expect
    .poll(
      async () => {
        const bookings = await prisma.booking.findMany({
          where: { propertyId: property.id, status: { not: "ANNULEE" } },
        });
        return bookings.length;
      },
      { timeout: 15_000 }
    )
    .toBe(1);
});
