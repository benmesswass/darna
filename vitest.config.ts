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
 * Visibilité CI : sous GitHub Actions on active le reporter `json`
 * (`coverage/test-results.json`), consommé par `scripts/ci-test-summary.mjs` qui
 * publie LE rapport détaillé (tous les tests, échecs, par fichier) + la
 * couverture dans la page du run (`$GITHUB_STEP_SUMMARY`). On garde un seul
 * rapport, clair et exhaustif, plutôt que plusieurs blocs concurrents.
 */
const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };
const inCI = Boolean(process.env.GITHUB_ACTIONS);

export default defineConfig({
  resolve: { alias },
  test: {
    reporters: inCI ? ["default", "json"] : ["default"],
    outputFile: { json: "./coverage/test-results.json" },
    // Désactivé en CI seulement : résolution concurrente de `next-auth`/`next/server`
    // par les projets `node`/`jsdom` en parallèle → échec intermittent
    // "Cannot find module .../next/server" sur le runner GitHub Actions (jamais
    // reproduit en local malgré plusieurs runs). Coût négligeable (~600 tests,
    // quelques secondes), gardé rapide en local où la race ne se manifeste pas.
    fileParallelism: !inCI,
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
