import type { Page } from "@playwright/test";

/**
 * `BookingDatePicker` est un calendrier custom (2 mois affichés simultanément,
 * jours = boutons sans `data-testid` ni `aria-label` par date — seul le
 * numéro du jour est visible). On cible toujours le mois "suivant" (2ᵉ mois
 * affiché, `.last()` sur le numéro de jour) : garanti disponible (annonce
 * fraîche, aucune indisponibilité) et jamais "passé", quel que soit le jour
 * d'exécution du test.
 */
async function clickDayInSecondMonth(page: Page, day: number): Promise<void> {
  await page
    .locator("button:not([disabled])")
    .filter({ hasText: new RegExp(`^${day}$`) })
    .last()
    .click();
}

/** Sélectionne arrivée = jour 5 et départ = jour 7 du mois suivant. */
export async function selectStayDates(page: Page): Promise<void> {
  await clickDayInSecondMonth(page, 5);
  await clickDayInSecondMonth(page, 7);
}

/**
 * Lit un code OTP affiché en mode démo (email ou téléphone) : dans les deux
 * flows (`EmailVerifyFlow`, `PhoneVerifyFlow`) le code suit immédiatement,
 * dans le DOM, le `<p>` libellé — aucun `data-testid` n'existe sur ces écrans.
 */
export async function readDemoCode(page: Page, labelText: string): Promise<string> {
  const code = await page
    .getByText(labelText, { exact: true })
    .locator("xpath=following-sibling::p[1]")
    .innerText();
  return code.trim();
}
