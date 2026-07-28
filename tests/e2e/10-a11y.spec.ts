import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import * as allure from "allure-js-commons";
import { test, expect } from "./fixtures";
import { E2E_PROPERTY_SLUGS } from "./seed-data";

/**
 * TEST_AUTOMATION_ROADMAP.md §6.8 : axe sur les pages clés × 3 langues,
 * zéro violation serious/critical (wording exact de la roadmap). Les
 * violations minor/moderate sont journalisées (visibles dans le rapport
 * Allure) mais ne font pas échouer le test.
 */
const LOCALES = ["fr", "en", "ar"] as const;

const slug = E2E_PROPERTY_SLUGS.booking;
const PUBLIC_PAGES = [
  { name: "Accueil", path: "/" },
  { name: "Recherche", path: "/sejours" },
  { name: "Annonce", path: `/annonce/${slug}` },
  { name: "Réservation", path: `/annonce/${slug}/reserver` },
] as const;

async function setLocale(page: Page, locale: (typeof LOCALES)[number]): Promise<void> {
  await page.context().addCookies([
    {
      name: "darna-locale",
      value: locale,
      url: page.url().startsWith("http") ? page.url() : "http://localhost:3000",
    },
  ]);
}

/**
 * `color-contrast` a rejoint le gate bloquant (LANCEMENT_ROADMAP.md §L9.1,
 * TODO-PRODUCTION.md §Accessibility) : `text-body/*` (4.05-4.16:1) et
 * `text-white/50` (4.16:1) remplacés par les tokens `text-muted`/
 * `text-subtle` (`--color-muted`/`--color-subtle`, src/app/globals.css) et
 * `text-white/70`, tous ≥ 4.5:1 AA sur chaque fond utilisé (clair et
 * sombre). Plus aucune catégorie exclue du gate.
 */
const EXCLUDED_FROM_GATE = new Set<string>([]);

async function scan(page: Page, pageName: string, locale: string): Promise<void> {
  await allure.step(`Scanner "${pageName}" en ${locale}`, async () => {
    // Attend que polices + images soient posées avant l'analyse : sur le
    // premier hit d'une route en mode dev (compilation à la demande) ou une
    // page à forte charge de peinture (grille d'annonces, ~20 images
    // simultanées), axe peut sinon scanner une frame pas encore composée et
    // remonter des couleurs de rendu erronées (dérive vers le fond, sans
    // rapport avec les vraies couleurs affichées) — faux positifs
    // `color-contrast` non reproductibles (constaté empiriquement, cf. L9.1).
    // PAS `waitForLoadState("networkidle")` : le WebSocket HMR de `next dev`
    // reste ouvert en continu, donc « idle » n'est jamais atteint et le wait
    // timeout (60 s) au lieu de résoudre.
    await page.evaluate(() => document.fonts.ready);
    // Course contre un timeout, jamais un `Promise.all` nu : `next/image` est
    // lazy par défaut, les cartes hors écran (grille de résultats) ne
    // démarrent leur chargement qu'au scroll — attendre leur `load` sans
    // filet bloquerait indéfiniment (vécu : run > 300 s, tué manuellement).
    await page.evaluate(() =>
      Promise.race([
        Promise.all(
          Array.from(document.images)
            .filter((img) => !img.complete)
            .map((img) => new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            }))
        ),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ])
    );
    // Marge de composition : laisse le compositeur peindre la frame finale
    // après le dernier chargement (police/image) avant l'échantillonnage axe.
    await page.waitForTimeout(150);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (v) => (v.impact === "serious" || v.impact === "critical") && !EXCLUDED_FROM_GATE.has(v.id)
    );
    const nonBlocking = results.violations.filter((v) => !blocking.includes(v));

    if (nonBlocking.length > 0) {
      await allure.attachment(
        "violations non bloquantes (minor/moderate + color-contrast exclu du gate)",
        JSON.stringify(nonBlocking.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), null, 2),
        "application/json"
      );
    }

    expect(
      blocking,
      blocking.map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nœud(s))`).join("\n")
    ).toEqual([]);
  });
}

test.describe("Accessibilité (axe) — pages publiques", () => {
  for (const { name, path } of PUBLIC_PAGES) {
    for (const locale of LOCALES) {
      test(`${name} — ${locale}`, async ({ page }) => {
        await allure.epic("Plateforme");
        await allure.feature("Accessibilité (axe)");
        await allure.story(name);

        await setLocale(page, locale);
        await page.goto(path);
        await scan(page, name, locale);
      });
    }
  }
});

test.describe("Accessibilité (axe) — dashboard (authentifié)", () => {
  for (const locale of LOCALES) {
    test(`Dashboard — ${locale}`, async ({ hostPage }) => {
      await allure.epic("Plateforme");
      await allure.feature("Accessibilité (axe)");
      await allure.story("Dashboard");

      await setLocale(hostPage, locale);
      await hostPage.goto("/dashboard/reservations");
      await scan(hostPage, "Dashboard", locale);
    });
  }
});
