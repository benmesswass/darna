import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import { fr } from "@/lib/i18n/fr";

/**
 * Le rate-limit "connexion" (src/lib/rate-limit.ts) est en mémoire, partagé
 * par IP sur tout le process `next dev`. Chaque test ci-dessous reçoit une IP
 * factice dédiée (`x-forwarded-for`, lu en confiance en mode non-production)
 * pour ne jamais partager son quota de 5 tentatives/15 min avec un autre test
 * — y compris les 4 connexions de seed (cf. global-setup.ts). L'octet varie
 * avec `testInfo.retry` pour rester valide même en cas de re-run.
 */
function fakeIp(base: number, testInfo: { retry: number }): string {
  return `10.0.1.${base + testInfo.retry}`;
}

test.describe("Inscription et connexion", () => {
  test.beforeEach(async () => {
    await allure.epic("Compte");
    await allure.feature("Inscription & connexion");
  });

  test("inscription puis connexion", async ({ browser }, testInfo) => {
    await allure.story("Un nouveau compte peut s'inscrire puis se connecter");
    const context = await browser.newContext({
      extraHTTPHeaders: { "x-forwarded-for": fakeIp(10, testInfo) },
    });
    const p = await context.newPage();

    const email = `e2e-signup-${testInfo.retry}-${testInfo.workerIndex}@darna.tn`;

    await allure.step("Remplir et soumettre le formulaire d'inscription", async () => {
      await p.goto("/inscription");
      await p.locator('input[name="name"]').fill("E2E Signup User");
      await p.locator('input[name="email"]').fill(email);
      await p.locator('input[name="password"]').fill("SignupPass2026!");
      await p.locator('input[name="confirmPassword"]').fill("SignupPass2026!");
      await p.locator('form button[type="submit"]').click();
    });

    await allure.step("Vérifier la redirection et la bannière post-inscription", async () => {
      await p.waitForURL((url) => url.pathname === "/connexion");
      await expect(p.getByText(fr.auth.compteCreeConnectezVous)).toBeVisible();
    });

    await allure.step("Se connecter avec le nouveau compte", async () => {
      await p.locator('input[name="password"]').fill("SignupPass2026!");
      await p.locator('form button[type="submit"]').click();
      await p.waitForURL((url) => url.pathname !== "/connexion");
    });

    await context.close();
  });

  test("mot de passe incorrect renvoie le message générique anti-énumération", async ({
    browser,
  }, testInfo) => {
    await allure.story("Un mot de passe incorrect ne distingue jamais e-mail inconnu vs mot de passe faux");
    const context = await browser.newContext({
      extraHTTPHeaders: { "x-forwarded-for": fakeIp(20, testInfo) },
    });
    const page = await context.newPage();

    await allure.step("Soumettre un mauvais mot de passe", async () => {
      await page.goto("/connexion");
      await page.locator('input[name="email"]').fill("e2e-traveler-a@darna.tn");
      await page.locator('input[name="password"]').fill("WrongPassword!");
      await page.locator('form button[type="submit"]').click();
    });

    await allure.step("Vérifier le message générique anti-énumération", async () => {
      await expect(page.locator('p[role="alert"]')).toHaveText(fr.auth.identifiantsInvalides);
    });

    await context.close();
  });

  test("après 5 échecs, même un mot de passe correct est bloqué", async ({
    browser,
  }, testInfo) => {
    await allure.story("Le rate-limit bloque la connexion même avec les bons identifiants");
    const context = await browser.newContext({
      extraHTTPHeaders: { "x-forwarded-for": fakeIp(30, testInfo) },
    });
    const page = await context.newPage();
    await page.goto("/connexion");

    await allure.step("Épuiser le quota avec 5 échecs consécutifs", async () => {
      for (let i = 0; i < 5; i++) {
        await page.locator('input[name="email"]').fill("e2e-traveler-a@darna.tn");
        await page.locator('input[name="password"]').fill("WrongPassword!");
        await page.locator('form button[type="submit"]').click();
        await expect(page.locator('p[role="alert"]')).toHaveText(fr.auth.identifiantsInvalides);
      }
    });

    await allure.step("Vérifier qu'un mot de passe CORRECT est aussi bloqué (6ᵉ tentative)", async () => {
      await page.locator('input[name="email"]').fill("e2e-traveler-a@darna.tn");
      await page.locator('input[name="password"]').fill(
        process.env.E2E_TEST_PASSWORD ?? "e2e-ci-only-dummy-password-2026"
      );
      await page.locator('form button[type="submit"]').click();
      await expect(page.locator('p[role="alert"]')).toHaveText(fr.auth.identifiantsInvalides);
      await expect(page).toHaveURL(/\/connexion/);
    });

    await context.close();
  });
});
