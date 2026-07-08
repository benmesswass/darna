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
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/actions/**"],
      exclude: ["src/lib/i18n/**", "**/*.d.ts"],
      reporter: ["text-summary", "html", "lcov"],
      thresholds: {
        lines: 43,
        statements: 41,
        functions: 36,
        branches: 35,
      },
    },
  },
});
