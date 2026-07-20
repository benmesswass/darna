/**
 * Rapport k6 publié dans la page du run GitHub Actions (même esprit que
 * scripts/ci-test-summary.mjs pour le job `build` — TEST_AUTOMATION_ROADMAP.md
 * §7.3/§7.4). k6 n'a pas d'intégration Allure mature (contrairement à
 * Playwright/allure-playwright) : ce script produit donc un rapport dédié
 * custom à partir du JSON natif `--summary-export`, dans le même esprit
 * (chiffres clairs, seuils explicites, pas juste un statut vert/rouge).
 *
 * Best-effort : n'échoue jamais le job. À exécuter en `if: always()`.
 */
import { readFileSync, appendFileSync } from "node:fs";

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (!summaryPath) {
  console.log("GITHUB_STEP_SUMMARY absent — rapport ignoré (hors CI).");
  process.exit(0);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

const ms = (n) => (typeof n === "number" ? `${Math.round(n)} ms` : "—");
const pct = (n) => (typeof n === "number" ? `${(n * 100).toFixed(2)} %` : "—");

const data = readJson(process.argv[2] ?? "k6-summary.json");
const out = [];

if (!data || !data.metrics) {
  out.push(
    "## 📈 Rapport de charge k6 — indisponible",
    "",
    "Le fichier `k6-summary.json` est absent ou illisible — voir les logs du step `k6 run` ci-dessus."
  );
  appendFileSync(summaryPath, out.join("\n") + "\n");
  process.exit(0);
}

const metrics = data.metrics;

// Collecte tous les seuils déclarés (thresholds), tous métriques confondues,
// pour un statut global — un seuil en échec fait échouer `k6 run` lui-même
// (exit code non-zéro), donc ce bandeau reflète surtout un run qui a pu
// aboutir malgré un léger dépassement si non bloquant selon la config.
let allThresholdsOk = true;
const thresholdRows = [];
for (const [name, metric] of Object.entries(metrics)) {
  if (!metric?.thresholds) continue;
  for (const [expr, result] of Object.entries(metric.thresholds)) {
    const ok = result?.ok !== false;
    if (!ok) allThresholdsOk = false;
    thresholdRows.push(`| \`${name}\` | \`${expr}\` | ${ok ? "✅" : "❌"} |`);
  }
}

const duration = metrics.http_req_duration?.values ?? {};
const failed = metrics.http_req_failed?.values ?? {};
const reqs = metrics.http_reqs?.values ?? {};

out.push(
  `# ${allThresholdsOk ? "✅" : "❌"} Rapport de charge k6 — ${allThresholdsOk ? "seuils respectés" : "seuil(s) dépassé(s)"}`,
  "",
  "Charge sur `/sejours` (recherche) contre un build de production " +
    "(`next start`) — cf. `tests/k6/search-load.js`. Nightly/manuel uniquement, " +
    "jamais bloquant sur les PR (TEST_AUTOMATION_ROADMAP.md §7.2).",
  "",
  "## Résumé",
  "",
  "| Métrique | Valeur |",
  "|---|---|",
  `| Requêtes totales | ${reqs.count ?? "—"} |`,
  `| Débit | ${typeof reqs.rate === "number" ? `${reqs.rate.toFixed(1)} req/s` : "—"} |`,
  `| Latence moyenne | ${ms(duration.avg)} |`,
  `| Latence médiane | ${ms(duration.med)} |`,
  `| **p90** | ${ms(duration["p(90)"])} |`,
  `| **p95** (seuil : < 500 ms) | ${ms(duration["p(95)"])} |`,
  `| Latence max | ${ms(duration.max)} |`,
  `| Taux d'échec HTTP (seuil : < 1 %) | ${pct(failed.rate)} |`,
  ""
);

if (thresholdRows.length > 0) {
  out.push(
    "## Seuils déclarés",
    "",
    "| Métrique | Seuil | Statut |",
    "|---|---|:---:|",
    ...thresholdRows,
    ""
  );
}

out.push(
  "> Rapport JSON complet (`k6-summary.json`) disponible dans l'artifact `k6-report` de ce run."
);

appendFileSync(summaryPath, out.join("\n") + "\n");
