import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Tests unitaires + intégration des chemins critiques (paiement, booking,
 * rate limiting, concurrence). Environnement `node` (modules serveur) ; on
 * réutilise l'alias `@/` du tsconfig. Les tests vivent dans `tests/` (hors
 * `src/`) pour ne jamais être pris pour des routes par Next ni embarqués dans
 * le bundle de prod.
 *
 * Couverture (Phase 1, TEST_AUTOMATION_ROADMAP §7) : provider v8, activée via
 * `npm run test:coverage` (non par défaut, pour garder `npm test` rapide en
 * local). Les seuils ci-dessous sont un PLANCHER de non-régression (« ratchet »)
 * calé légèrement sous la couverture réelle du jour — ils empêchent une PR de
 * FAIRE BAISSER la couverture du cœur backend (`src/lib` + `src/actions`). On
 * les remonte au fil des phases. Cibles visées : `src/lib` ≥ 85 %,
 * modules paiement/auth critiques ~100 %, global ≥ 70 %.
 *
 * Les dictionnaires i18n sont exclus (données pures, sans logique testable qui
 * fausseraient le dénominateur), ainsi que les déclarations de types.
 *
 * Visibilité CI (Phase 1) : sous GitHub Actions on ajoute le reporter
 * `github-actions` — il annote les tests échoués inline dans la PR ET publie le
 * récap tests (fichiers/réussis/échoués) dans la page du run. Le reporter `json`
 * (`coverage/test-results.json`) fournit un résultat machine dans l'artifact de
 * couverture uploadé. La couverture, elle, est ajoutée au run par
 * `scripts/ci-test-summary.mjs` (lit `coverage/coverage-summary.json`). En local
 * on garde le reporter par défaut.
 */
const inCI = Boolean(process.env.GITHUB_ACTIONS);

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    reporters: inCI ? ["default", "github-actions", "json"] : ["default"],
    outputFile: { json: "./coverage/test-results.json" },
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/actions/**"],
      exclude: ["src/lib/i18n/**", "**/*.d.ts"],
      // `json-summary` alimente le récap de couverture du run (step CI).
      reporter: ["text-summary", "html", "lcov", "json-summary"],
      thresholds: {
        lines: 43,
        statements: 41,
        functions: 36,
        branches: 35,
      },
    },
  },
});
