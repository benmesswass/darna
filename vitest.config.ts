import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Deux projets de test (Vitest « projects ») :
 *   - `node`   : tests unitaires + intégration serveur (fichiers `.test.ts`
 *                sous `tests/`), environnement Node (modules serveur, Prisma).
 *   - `jsdom`  : tests de COMPOSANTS React (fichiers `.test.tsx` sous
 *                `tests/components/`), environnement jsdom + @testing-library.
 * On réutilise l'alias `@/` du tsconfig dans les deux. Les tests vivent dans
 * `tests/` (hors `src/`) pour ne jamais être pris pour des routes par Next.
 *
 * Couverture (Phase 1) : provider v8, scope cœur backend (`src/lib`+`src/actions`),
 * seuils ratchet bloquants — plancher de non-régression, relevé au fil des phases.
 * Cibles : `src/lib` ≥ 85 %, paiement/auth ~100 %, global ≥ 70 %. Les dicos i18n
 * (données pures) et les `.d.ts` sont exclus.
 *
 * Visibilité CI : sous GitHub Actions on ajoute le reporter `github-actions`
 * (annotations inline + récap tests dans le run) et `json` (résultat machine dans
 * l'artifact). La couverture est ajoutée au run par `scripts/ci-test-summary.mjs`.
 */
const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };
const inCI = Boolean(process.env.GITHUB_ACTIONS);

export default defineConfig({
  resolve: { alias },
  test: {
    reporters: inCI ? ["default", "github-actions", "json"] : ["default"],
    outputFile: { json: "./coverage/test-results.json" },
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/actions/**"],
      exclude: ["src/lib/i18n/**", "**/*.d.ts"],
      reporter: ["text-summary", "html", "lcov", "json-summary"],
      thresholds: {
        lines: 43,
        statements: 41,
        functions: 36,
        branches: 35,
      },
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["tests/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        plugins: [react()],
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["tests/components/**/*.test.tsx"],
          setupFiles: ["tests/components/setup.ts"],
        },
      },
    ],
  },
});
