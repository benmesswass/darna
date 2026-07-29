import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import { fr } from "@/lib/i18n/fr";
import { E2E_PASSWORD, E2E_USERS } from "./seed-data";

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

// P2.4 (ROADMAP.md, batch auth/session) — flags du cookie de session NextAuth
// et rejet d'un JWT altéré. `authjs.session-token` est posé par NextAuth
// (src/lib/auth.ts, session: { strategy: "jwt" }, aucune config `cookies`
// personnalisée) — comportement du framework, pas du code Darna, mais figé
// ici comme régression : si une future config `cookies` l'affaiblissait
// (ex. sameSite: "none"), ce test le détecterait.
test.describe("Session — cookie et JWT (P2.4)", () => {
  test("le cookie de session est HttpOnly, SameSite=Lax, avec une expiration ~30 j", async ({
    browser,
  }, testInfo) => {
    await allure.epic("Compte");
    await allure.feature("Session");
    await allure.story("Le cookie de session porte les bons flags de sécurité");

    const context = await browser.newContext({
      extraHTTPHeaders: { "x-forwarded-for": fakeIp(40, testInfo) },
    });
    const page = await context.newPage();
    await page.goto("/connexion");
    await page.locator('input[name="email"]').fill(E2E_USERS.travelerA.email);
    await page.locator('input[name="password"]').fill(E2E_PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname !== "/connexion");

    const cookies = await context.cookies();
    // Nom exact vérifié empiriquement (Auth.js v5, stratégie JWT, pas de
    // préfixe __Secure- en HTTP local — attendu, il apparaît en HTTPS prod).
    const session = cookies.find((c) => c.name === "authjs.session-token");
    expect(session, "cookie authjs.session-token absent après connexion").toBeDefined();
    expect(session!.httpOnly).toBe(true);
    expect(session!.sameSite).toBe("Lax");
    expect(session!.path).toBe("/");

    const daysUntilExpiry = (session!.expires - Date.now() / 1000) / 86400;
    expect(daysUntilExpiry).toBeGreaterThan(25);
    expect(daysUntilExpiry).toBeLessThan(35);

    await context.close();
  });

  test("un cookie de session altéré est traité comme non-authentifié (jamais une erreur serveur)", async ({
    browser,
  }, testInfo) => {
    await allure.story("Un JWT corrompu redirige vers /connexion sans planter");

    const context = await browser.newContext({
      extraHTTPHeaders: { "x-forwarded-for": fakeIp(50, testInfo) },
    });
    const page = await context.newPage();
    await page.goto("/connexion");
    await page.locator('input[name="email"]').fill(E2E_USERS.travelerA.email);
    await page.locator('input[name="password"]').fill(E2E_PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname !== "/connexion");
    // L'accès protégé juste après connexion est déjà prouvé par les tests
    // voisins (ex. redirection hors /connexion ci-dessus) — pas reconfirmé
    // ici pour éviter une double navigation sur la même page.

    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name === "authjs.session-token")!;
    await context.addCookies([
      {
        ...session,
        // JWE Auth.js : altérer le corps chiffré (après le 2e point) invalide
        // le tag d'authentification AEAD — jamais un déchiffrement silencieux.
        value: session.value.slice(0, -10) + "XXXXXXXXXX",
      },
    ]);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/connexion/);

    await context.close();
  });
});
