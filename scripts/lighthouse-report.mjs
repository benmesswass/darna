/**
 * Lighthouse mobile (throttling simulé) sur les pages clés (LANCEMENT_ROADMAP.md
 * §L9.3) : /, /sejours, une page annonce (slug passé en argument). Seuils
 * LCP < 2.5 s / CLS < 0.1 — WARNING seulement, jamais bloquant (`process.exit`
 * toujours 0, cohérent avec les autres jobs niveau 3 — ZAP/k6 — qui publient un
 * rapport sans faire échouer le nightly). Un run réel calibrera les seuils
 * plus tard si besoin, comme pour ZAP.
 *
 * Usage : node scripts/lighthouse-report.mjs <baseUrl> <annonceSlug>
 */
import { execFileSync } from "node:child_process";
import { readFileSync, appendFileSync, unlinkSync } from "node:fs";

const [baseUrl, annonceSlug] = process.argv.slice(2);
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!baseUrl || !annonceSlug) {
  console.error("Usage: node scripts/lighthouse-report.mjs <baseUrl> <annonceSlug>");
  process.exit(0);
}

const PAGES = [
  { name: "Accueil", path: "/" },
  { name: "Recherche", path: "/sejours" },
  { name: "Annonce", path: `/annonce/${annonceSlug}` },
];

const THRESHOLDS = { lcp: 2.5, cls: 0.1 };

function runLighthouse(url) {
  const outFile = `/tmp/lh-${Buffer.from(url).toString("base64url")}.json`;
  execFileSync(
    "npx",
    [
      "lighthouse",
      url,
      "--output=json",
      `--output-path=${outFile}`,
      "--only-categories=performance",
      "--form-factor=mobile",
      "--screenEmulation.mobile",
      "--throttling-method=simulate",
      "--chrome-flags=--headless --no-sandbox --disable-gpu",
      "--quiet",
    ],
    { stdio: ["ignore", "ignore", "inherit"] }
  );
  const report = JSON.parse(readFileSync(outFile, "utf8"));
  unlinkSync(outFile);
  const lcpSeconds = report.audits["largest-contentful-paint"].numericValue / 1000;
  const cls = report.audits["cumulative-layout-shift"].numericValue;
  const perfScore = Math.round((report.categories.performance.score ?? 0) * 100);
  return { lcpSeconds, cls, perfScore };
}

const rows = [];
for (const { name, path } of PAGES) {
  const url = `${baseUrl}${path}`;
  try {
    const { lcpSeconds, cls, perfScore } = runLighthouse(url);
    const lcpFlag = lcpSeconds > THRESHOLDS.lcp ? "⚠️" : "✅";
    const clsFlag = cls > THRESHOLDS.cls ? "⚠️" : "✅";
    rows.push(
      `| ${name} | ${perfScore}/100 | ${lcpFlag} ${lcpSeconds.toFixed(2)} s | ${clsFlag} ${cls.toFixed(3)} |`
    );
    console.log(`${name}: perf=${perfScore} LCP=${lcpSeconds.toFixed(2)}s CLS=${cls.toFixed(3)}`);
  } catch (e) {
    rows.push(`| ${name} | — | échec (${String(e).slice(0, 80)}) | — |`);
    console.error(`${name}: échec Lighthouse —`, e);
  }
}

const summary = [
  "## 🚦 Rapport Lighthouse (mobile, throttling simulé)",
  "",
  `Seuils informatifs (pas bloquants) : LCP < ${THRESHOLDS.lcp} s, CLS < ${THRESHOLDS.cls}.`,
  "",
  "| Page | Score perf | LCP | CLS |",
  "|---|---|---|---|",
  ...rows,
].join("\n");

console.log(summary);
if (summaryPath) appendFileSync(summaryPath, summary + "\n");
