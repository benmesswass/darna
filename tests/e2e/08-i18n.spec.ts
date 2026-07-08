import { test, expect } from "@playwright/test";
import { ar } from "@/lib/i18n/ar";

test("i18n : bascule fr→ar, RTL et libellés clés", async ({ page }) => {
  await page.goto("/connexion");

  await page.locator('button[lang="ar"]').click();

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("button", { name: ar.auth.seConnecter })).toBeVisible();
  await expect(page.getByText(ar.auth.email, { exact: true })).toBeVisible();
});
