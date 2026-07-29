import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Trois projets de test (Vitest « projects ») :
 *   - `node`        : tests unitaires (fichiers `.test.ts` sous `tests/`,
 *                     Prisma mocké), environnement Node.
 *   - `jsdom`        : tests de COMPOSANTS React (fichiers `.test.tsx` sous
 *                     `tests/components/`), environnement jsdom + @testing-library.
 *   - `integration`  : tests contre un VRAI Postgres (fichiers
 *                     `*.integration.test.ts` sous `tests/integration/`,
 *                     ROADMAP.md §P2.5) — concurrence réelle, jamais Prisma
 *                     mocké. Projet SÉPARÉ (pas juste un `runIf(DB_ENABLED)`
 *                     dans `node`) : invocable seul (`npm run test:integration`),
 *                     exclu explicitement de `node` pour ne jamais tourner deux
 *                     fois. Chaque fichier garde son propre `runIf(DB_ENABLED)`
 *                     en filet (erreur claire si invoqué sans DATABASE_URL).
 * On réutilise l'alias `@/` du tsconfig dans les trois. Les tests vivent dans
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
const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
  // `next-auth/lib/env.js` importe `next/server` sans extension. Sans champ
  // `exports` dans le package.json de `next`, ce spécificateur retombe sur la
  // résolution Node native (stricte sur les extensions) selon que le module
  // soit externalisé ou non par Vite — intermittent d'un run à l'autre :
  // "Cannot find module .../next/server", alors que next/server.js existe.
  // Alias explicite vers le fichier réel : élimine l'ambiguïté de résolution.
  "next/server": fileURLToPath(new URL("./node_modules/next/server.js", import.meta.url)),
};
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
      // Gate cliquet (ROADMAP.md §P1.2, remonté §P2.10) : plancher fixé juste
      // sous la couverture RÉELLE mesurée le 2026-07-29 après P2.10
      // (64,26 % stmt / 57,34 % branches / 60,11 % functions / 66,04 % lignes),
      // avec une petite marge de sécurité (~1 pt) contre le bruit de mesure —
      // pas au-dessus, sinon ce commit lui-même échouerait le gate qu'il
      // introduit. À remonter au fil des PR suivantes de P2.10 (reste :
      // src/actions/auth.ts, src/lib/auth.ts/google-auth.ts — ces deux
      // derniers sont des fichiers de config NextAuth exercés uniquement par
      // les e2e Playwright, invisibles du coverage Vitest par construction),
      // jamais à redescendre.
      thresholds: {
        lines: 65,
        statements: 63,
        functions: 59,
        branches: 56,
      },
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["tests/**/*.test.ts"],
          exclude: ["tests/integration/**"],
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
      {
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.integration.test.ts"],
          // Fichiers exécutés en SÉRIE (jamais en parallèle entre eux) : ce
          // sont de VRAIES transactions Postgres, contrairement à `node`/
          // `jsdom` (Prisma mocké). Deux fichiers d'intégration lancés en
          // parallèle peuvent se contentionner l'un l'autre au niveau moteur
          // (abandon de sérialisation P2034 sur une transaction sans rapport
          // avec l'autre fichier) — observé empiriquement en CI complète.
          // Coût négligeable : quelques fichiers, quelques secondes au total.
          fileParallelism: false,
        },
      },
    ],
  },
});
