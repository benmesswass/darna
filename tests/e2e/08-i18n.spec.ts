import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import { ar } from "@/lib/i18n/ar";

test("i18n : bascule fr→ar, RTL et libellés clés", async ({ page }) => {
  await allure.epic("Plateforme");
  await allure.feature("Internationalisation");
  await allure.story("La bascule fr→ar applique le RTL et traduit les libellés");

  await allure.step("Basculer vers l'arabe via le sélecteur de langue", async () => {
    await page.goto("/connexion");
    await page.locator('button[lang="ar"]').click();
  });

  await allure.step("Vérifier le RTL et les libellés traduits", async () => {
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("button", { name: ar.auth.seConnecter })).toBeVisible();
    await expect(page.getByText(ar.auth.email, { exact: true })).toBeVisible();
  });
});
