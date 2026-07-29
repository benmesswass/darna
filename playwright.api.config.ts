import { defineConfig } from "@playwright/test";

/**
 * Phase 4 (TEST_AUTOMATION_ROADMAP.md) : tests HTTP purs (`request` context,
 * pas de navigateur) contre les routes `api/**` et régressions sécurité.
 *
 * Config SÉPARÉE de `playwright.config.ts` (E2E navigateur) : tester les
 * portes de `/api/payments/konnect/webhook` (400/401/429) exige
 * `PAYMENT_MODE=konnect` actif sur le serveur — incompatible avec le job E2E
 * qui dépend du paiement démo (Konnect désactivé). Un seul `next dev` ne peut
 * pas avoir les deux valeurs en même temps ; d'où un serveur/job dédié.
 */

// P2.3 (ROADMAP.md, SSRF) — tests/api/security-regressions.spec.ts importe
// src/lib/konnect.ts DIRECTEMENT dans CE process (pas seulement dans le
// serveur ci-dessous, cf. webServer.env) pour vérifier que l'hôte de sortie
// de initKonnectPayment reste épinglé quels que soient les paramètres.
// KONNECT_API_KEY/KONNECT_RECEIVER_WALLET_ID y sont figées en constantes de
// module au premier import : doivent donc être posées ICI, avant tout import
// de fichier de test, pas dans un test individuel (trop tard, le module
// serait déjà chargé). Mêmes valeurs factices que webServer.env, jamais une
// vraie clé.
process.env.KONNECT_API_KEY ??= "api-tests-dummy-key-not-real";
process.env.KONNECT_RECEIVER_WALLET_ID ??= "api-tests-dummy-wallet-not-real";
export default defineConfig({
  testDir: "./tests/api",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["allure-playwright", { outputFolder: "allure-results-api" }]],
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      PAYMENT_MODE: "konnect",
      // Identifiants factices — jamais de vraie clé. Suffisent à satisfaire
      // la validation de démarrage (src/lib/env.ts) et à activer
      // `isKonnectEnabled()` ; aucun appel réseau sortant réel n'est exercé
      // par les tests de ce projet (cf. plan — le succès de règlement réel
      // reste couvert par les tests Vitest mockés existants).
      KONNECT_API_KEY: "api-tests-dummy-key-not-real",
      KONNECT_RECEIVER_WALLET_ID: "api-tests-dummy-wallet-not-real",
      // PAYMENT_MODE=konnect ci-dessus active `anyRealMode` côté
      // src/lib/env.ts (§L3.1, depuis PR #208/L4.2) — CRON_SECRET devient
      // alors obligatoire au démarrage, sinon le serveur de test refuse de
      // démarrer (`Error: Variables d'environnement invalides`). Factice,
      // ≥ 32 caractères (exigence zod), jamais une vraie valeur.
      CRON_SECRET: "api-tests-dummy-cron-secret-not-real-0000",
    },
  },
});
