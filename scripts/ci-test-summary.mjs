/**
 * Rapport de tests + couverture publié dans la page du run GitHub Actions
 * (TEST_AUTOMATION_ROADMAP §7 — « tous les tests visibles en CI, rapport clair
 * et détaillé »). Best-effort : n'échoue jamais le job. À exécuter en
 * `if: always()` pour publier même quand les tests échouent.
 *
 * Sources produites par `npm run test:coverage` sous CI :
 *   - coverage/test-results.json      (reporter `json` de Vitest)
 *   - coverage/coverage-summary.json  (reporter `json-summary` de v8)
 *
 * Le rapport contient : un bandeau de statut, les totaux, la liste DÉTAILLÉE des
 * tests échoués (avec message), une table par fichier, le détail repliable de
 * TOUS les tests, puis la couverture du cœur backend.
 */
import { readFileSync, appendFileSync } from "node:fs";
import { relative } from "node:path";

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

const ICON = { passed: "✅", failed: "❌", skipped: "⏭️", pending: "⏭️", todo: "📝" };
const stripAnsi = (s) => s.replace(/\[[0-9;]*m/g, "");
const ms = (n) => (n == null ? "—" : `${Math.round(n)} ms`);
const rel = (p) => relative(process.cwd(), p) || p;

const out = [];
const push = (...l) => out.push(...l);

// ── Tests ──────────────────────────────────────────────────────────────────
const r = readJson("coverage/test-results.json");
if (r && Array.isArray(r.testResults)) {
  const files = r.testResults;
  const tests = files.flatMap((f) =>
    (f.assertionResults ?? []).map((a) => ({ file: rel(f.name), ...a }))
  );
  const count = (s) => tests.filter((t) => t.status === s).length;
  const passed = count("passed");
  const failed = count("failed");
  const skipped = count("skipped") + count("pending") + count("todo");
  const durationTotal = tests.reduce((s, t) => s + (t.duration ?? 0), 0);
  const ok = failed === 0 && r.success !== false;

  push(
    `# ${ok ? "✅" : "❌"} Rapport de tests — ${ok ? "SUCCÈS" : "ÉCHEC"}`,
    "",
    "| Fichiers | Tests | ✅ Réussis | ❌ Échoués | ⏭️ Ignorés | ⏱️ Durée |",
    "|:--------:|:-----:|:---------:|:---------:|:---------:|:--------:|",
    `| ${files.length} | ${tests.length} | ${passed} | ${failed} | ${skipped} | ${ms(durationTotal)} |`,
    ""
  );

  // Détail des échecs (mis en avant).
  const failures = tests.filter((t) => t.status === "failed");
  if (failures.length) {
    push("## ❌ Tests échoués", "");
    for (const t of failures) {
      push(`### \`${t.file}\` › ${t.fullName ?? t.title}`, "");
      const msg = stripAnsi((t.failureMessages ?? []).join("\n")).trim();
      if (msg) {
        push("```", msg.slice(0, 1200), "```", "");
      }
    }
  }

  // Table de synthèse par fichier.
  push(
    "## Par fichier",
    "",
    "| Statut | Fichier | Tests | ✅ | ❌ | ⏭️ | ⏱️ |",
    "|:------:|:--------|:-----:|:-:|:-:|:-:|:--:|",
    ...files.map((f) => {
      const a = f.assertionResults ?? [];
      const c = (s) => a.filter((x) => x.status === s).length;
      const sk = c("skipped") + c("pending") + c("todo");
      const dur = f.endTime && f.startTime ? f.endTime - f.startTime : null;
      const icon = f.status === "failed" ? "❌" : sk === a.length && a.length ? "⏭️" : "✅";
      return `| ${icon} | \`${rel(f.name)}\` | ${a.length} | ${c("passed")} | ${c("failed")} | ${sk} | ${ms(dur)} |`;
    }),
    ""
  );

  // Détail de TOUS les tests (repliable pour rester lisible).
  push("<details><summary>📋 Détail de tous les tests</summary>", "");
  for (const f of files) {
    const a = f.assertionResults ?? [];
    if (!a.length) continue;
    push(`**\`${rel(f.name)}\`**`, "");
    for (const t of a) {
      const name = t.fullName ?? [...(t.ancestorTitles ?? []), t.title].join(" › ");
      push(`- ${ICON[t.status] ?? "•"} ${name} _(${ms(t.duration)})_`);
    }
    push("");
  }
  push("</details>", "");
} else {
  push(
    "# Rapport de tests",
    "",
    "_Résultats indisponibles (coverage/test-results.json manquant)._",
    ""
  );
}

// ── Couverture ───────────────────────────────────────────────────────────────
const cov = readJson("coverage/coverage-summary.json");
push("## 📊 Couverture (cœur backend `src/lib` + `src/actions`)", "");
if (cov?.total) {
  const t = cov.total;
  const row = (label, m) => `| ${label} | ${m.pct}% | ${m.covered}/${m.total} |`;
  push(
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
  push("_Résumé de couverture indisponible (coverage/coverage-summary.json manquant)._", "");
}

appendFileSync(summaryPath, out.join("\n") + "\n");
console.log("Rapport de tests + couverture publié dans le run.");
