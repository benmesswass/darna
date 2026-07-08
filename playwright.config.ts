import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 3 (TEST_AUTOMATION_ROADMAP.md §6.5) : E2E navigateur.
 * Chromium uniquement pour ce P0 (environnement préinstallé) ; serveur de
 * test = `next dev` (pas de build séparé : cible "< 8 min", un build dédié
 * n'apporterait rien à ce périmètre).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // Défaut (30s) trop court : parcours multi-pages (goto + server action +
  // poll DB) sur un `next dev` à froid (compilation Turbopack par route).
  timeout: 60_000,
  // Défaut Playwright (5s) trop court pour les `expect.poll()` attendant une
  // mutation serveur (server action + DB) sous forte charge parallèle
  // (`fullyParallel`, plusieurs specs + compilations Turbopack simultanées).
  expect: { timeout: 15_000 },
  reporter: [["list"], ["allure-playwright", { outputFolder: "allure-results" }]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      // Forcé quel que soit l'environnement d'appel (local ou CI) — le
      // scénario 07-kyc-gating.spec.ts a besoin du gate actif pour être
      // significatif.
      KYC_GATING: "on",
      // Désactivé explicitement : les specs pilotent les formulaires auth
      // sans passer par le widget Turnstile (pas de token généré). Sans ce
      // override, un `.env` local avec CAPTCHA_MODE=turnstile (courant en dev,
      // avec les clés de test Cloudflare) ferait échouer toute connexion/
      // inscription E2E. Absent par défaut en CI (pas de `.env`), donc sans
      // effet là-bas — mais rend le comportement explicite et déterministe.
      CAPTCHA_MODE: "off",
    },
  },
});
