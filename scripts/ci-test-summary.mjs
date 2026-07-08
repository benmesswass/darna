/**
 * Publie le récap de COUVERTURE dans la page du run GitHub Actions (Phase 1,
 * TEST_AUTOMATION_ROADMAP). Le récap des tests (fichiers/réussis/échoués) est
 * déjà publié par le reporter `github-actions` de Vitest ; ce script complète
 * avec la couverture, que Vitest n'affiche pas dans le résumé du run.
 *
 * Source : coverage/coverage-summary.json (reporter json-summary de v8), produit
 * par `npm run test:coverage`. Écrit dans le fichier pointé par
 * $GITHUB_STEP_SUMMARY.
 *
 * Tolérant aux fichiers manquants : n'échoue jamais le job (best-effort). À
 * exécuter en `if: always()` pour publier même sur échec des tests.
 */
import { readFileSync, appendFileSync } from "node:fs";

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (!summaryPath) {
  console.log("GITHUB_STEP_SUMMARY absent — récap ignoré (hors CI).");
  process.exit(0);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

const lines = ["## 📊 Couverture (cœur backend `src/lib` + `src/actions`)", ""];

const cov = readJson("coverage/coverage-summary.json");
if (cov?.total) {
  const t = cov.total;
  const row = (label, m) => `| ${label} | ${m.pct}% | ${m.covered}/${m.total} |`;
  lines.push(
    "| Métrique | % | Couvert |",
    "|:---------|:-:|:-------:|",
    row("Lignes", t.lines),
    row("Instructions", t.statements),
    row("Fonctions", t.functions),
    row("Branches", t.branches),
    "",
    "> Seuils ratchet appliqués en gate CI (`vitest.config.ts`). Cible : `src/lib` ≥ 85 %.",
    ""
  );
} else {
  lines.push("_Résumé de couverture indisponible (coverage/coverage-summary.json manquant)._", "");
}

appendFileSync(summaryPath, lines.join("\n") + "\n");
console.log("Récap de couverture publié dans le run.");
