import { test, expect } from "./fixtures";
import { prisma } from "../../src/lib/prisma";
import { fr } from "@/lib/i18n/fr";
import { E2E_PROPERTY_SLUGS, E2E_USERS } from "./seed-data";

/**
 * Périmètre : annulation hôte → notification → page /relogement (suggestions +
 * réduction). On ne pousse pas jusqu'à consommer la réduction sur une NOUVELLE
 * réservation (ça dupliquerait le parcours déjà couvert par le scénario 02).
 */
test("annulation hôte → parcours relogement", async ({ hostCancelPage, travelerAPage }) => {
  const property = await prisma.property.findUniqueOrThrow({
    where: { slug: E2E_PROPERTY_SLUGS.cancel },
  });
  const booking = await prisma.booking.findFirstOrThrow({
    where: { propertyId: property.id, guestId: E2E_USERS.travelerA.id },
  });

  await hostCancelPage.goto("/dashboard/reservations");
  await hostCancelPage.getByRole("button", { name: fr.dashboard.annulerReservationHote }).click();

  const dialog = hostCancelPage.getByRole("dialog", { name: fr.dashboard.hostCancelModalTitre });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: fr.dashboard.annulerConfirm }).click();

  await expect
    .poll(async () => {
      const b = await prisma.booking.findUnique({ where: { id: booking.id } });
      return b?.status;
    })
    .toBe("ANNULEE");

  const cancelled = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
  expect(cancelled.cancelledByHostAt).not.toBeNull();
  expect(cancelled.refundAmount).toBe(booking.amountPaid);

  const host = await prisma.user.findUniqueOrThrow({ where: { id: E2E_USERS.hostCancel.id } });
  expect(host.suspended).toBe(true);

  // Autorisation (pas 404) + éléments toujours rendus, qu'il y ait ou non des
  // suggestions correspondantes (la page a un fallback "aucune suggestion").
  const response = await travelerAPage.goto(`/relogement/${booking.id}`);
  expect(response?.status()).toBe(200);
  await expect(
    travelerAPage.locator("summary", { hasText: fr.relogement.enSavoirPlus })
  ).toBeVisible();
});
