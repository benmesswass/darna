import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import { fr } from "@/lib/i18n/fr";
import { readDemoCode } from "./helpers";

/**
 * `KYC_GATING=on` est forcé par playwright.config.ts (webServer.env), quel que
 * soit l'environnement d'appel. Périmètre : le gate bloque puis se lève après
 * vérification — la création de l'annonce elle-même (tous les champs du
 * formulaire) n'est pas rejouée ici, déjà hors périmètre E2E gating.
 */
test("KYC : gate bloque la création d'annonce tant que non vérifié, puis se lève", async ({
  page,
}) => {
  await allure.epic("Conformité");
  await allure.feature("Vérification KYC");
  await allure.story("Le gate bloque la publication d'annonce tant que l'identité n'est pas vérifiée");

  const email = `e2e-kyc-host-${test.info().workerIndex}@darna.tn`;
  const password = "KycHostPass2026!";

  await allure.step("Inscrire un nouvel hôte", async () => {
    await page.goto("/inscription");
    await page.locator('input[name="name"]').fill("E2E KYC Host");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.locator('select[name="role"]').selectOption("HOTE");
    await page.locator('form button[type="submit"]').click();

    await page.waitForURL((url) => url.pathname === "/connexion");
    await page.locator('input[name="password"]').fill(password);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname !== "/connexion");
  });

  await allure.step("Vérifier que le gate bloque la création d'annonce (kycStatus NON_VERIFIE)", async () => {
    await page.goto("/dashboard/annonces/nouvelle");
    await expect(page.getByText(fr.kyc.gateRequiseTitre)).toBeVisible();
  });

  await page.goto("/dashboard/verifications");

  // Pas de reload entre les étapes : l'assistant avance côté client dès que
  // l'action serveur confirme (`state.verified`) — un reload juste après le
  // clic "Valider" court-circuiterait cette mutation en cours (race condition
  // observée : le reload rechargeait un état encore NON_VERIFIE).
  await allure.step("Vérifier l'e-mail (étape 1/3)", async () => {
    await page.getByRole("button", { name: fr.email.envoyerCode }).click();
    const emailCode = await readDemoCode(page, fr.email.modeDemoCode);
    await page.locator('input[name="otp"]').fill(emailCode);
    await page.getByRole("button", { name: fr.email.valider }).click();
  });

  await allure.step("Vérifier le téléphone (étape 2/3)", async () => {
    await page.locator('input[name="phone"]').fill("22345678");
    await page.getByRole("button", { name: fr.kyc.envoyerOtp }).click();
    const phoneCode = await readDemoCode(page, fr.kyc.votreCode);
    await page.locator('input[name="otp"]').fill(phoneCode);
    await page.getByRole("button", { name: fr.kyc.valider }).click();
  });

  await allure.step("Vérifier la CIN (étape 3/3)", async () => {
    await page.locator('input[name="cin"]').fill("12345678");
    await page.getByRole("button", { name: fr.kyc.validerCin }).click();
    // `page.goto()` juste après ne bénéficie pas de l'auto-retry d'un `.fill()`
    // sur la même page (contrairement aux étapes précédentes) — on attend donc
    // explicitement la confirmation avant de naviguer, sinon la navigation peut
    // devancer la persistance serveur du `kycStatus`.
    await expect(page.locator('input[name="cin"]')).not.toBeVisible();
  });

  await allure.step("Vérifier que le gate est levé", async () => {
    await page.goto("/dashboard/annonces/nouvelle");
    await expect(page.getByText(fr.kyc.gateRequiseTitre)).not.toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
  });
});
