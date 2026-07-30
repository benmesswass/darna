#!/usr/bin/env node
/**
 * P5.5 (ROADMAP.md) — bloque une migration Prisma potentiellement destructive
 * (DROP TABLE/COLUMN, ALTER COLUMN, TRUNCATE, DROP DATABASE/SCHEMA) tant que
 * la PR ne porte pas le label d'approbation explicite. Volontairement
 * conservateur : `ALTER COLUMN` déclenche même pour un simple `SET DEFAULT`
 * (pas toujours destructeur) — le coût d'un clic de label superflu est
 * négligeable face au risque d'un vrai changement de type/downtime qui
 * passerait inaperçu.
 *
 * Zéro dépendance npm (Node builtins uniquement) : exécutable sans `npm ci`,
 * job CI dédié volontairement rapide (`migration-gate` dans ci.yml).
 *
 * Logique pure (`findDestructiveStatements`, `hasApprovalLabel`) exportée
 * pour tests unitaires (tests/check-destructive-migrations.test.ts) ; la
 * plomberie git/CLI ci-dessous n'est volontairement pas unit-testée (même
 * convention que les autres scripts de scripts/, ex. ci-test-summary.mjs) —
 * vérifiée manuellement en conditions réelles avant merge (voir PR).
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export const APPROVAL_LABEL = "migration-approved";
const MIGRATIONS_DIR = "prisma/migrations";

export const DESTRUCTIVE_PATTERNS = [
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+COLUMN\b/i,
  /\bDROP\s+DATABASE\b/i,
  /\bDROP\s+SCHEMA\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\s+COLUMN\b/i,
];

/** Lignes non-commentées d'un SQL de migration qui matchent un mot-clé destructif. */
export function findDestructiveStatements(sqlContent) {
  const hits = [];
  for (const rawLine of sqlContent.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--")) continue;
    if (DESTRUCTIVE_PATTERNS.some((pattern) => pattern.test(line))) {
      hits.push(line);
    }
  }
  return hits;
}

/** `labelsCsv` : valeur brute de MIGRATION_GATE_PR_LABELS (noms séparés par virgule). */
export function hasApprovalLabel(labelsCsv) {
  return (labelsCsv ?? "")
    .split(",")
    .map((s) => s.trim())
    .includes(APPROVAL_LABEL);
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

/** Fichiers .sql ajoutés/modifiés par CETTE branche sous prisma/migrations/. */
function changedMigrationFiles() {
  const base = process.env.MIGRATION_GATE_BASE_SHA;
  const head = process.env.MIGRATION_GATE_HEAD_SHA;
  const range = base && head ? `${base}...${head}` : "origin/main...HEAD";

  let output;
  try {
    output = git(["diff", "--name-only", "--diff-filter=AM", range, "--", MIGRATIONS_DIR]);
  } catch (err) {
    // Échec fermé : mieux vaut un job qui plante (visible, corrigeable) qu'un
    // git diff silencieusement vide qui laisserait tout passer.
    console.error(`git diff a échoué (${range}) : ${err.message}`);
    process.exit(1);
  }
  return output.split("\n").filter((f) => f.endsWith(".sql"));
}

function main() {
  const files = changedMigrationFiles();
  if (files.length === 0) {
    console.log("Aucune migration nouvelle/modifiée — rien à vérifier.");
    return;
  }

  const findings = files
    .map((file) => ({ file, hits: findDestructiveStatements(readFileSync(file, "utf8")) }))
    .filter(({ hits }) => hits.length > 0);

  if (findings.length === 0) {
    console.log(`${files.length} migration(s) vérifiée(s), aucun mot-clé destructif détecté.`);
    return;
  }

  console.log("⚠️  Instruction(s) potentiellement destructive(s) détectée(s) :\n");
  for (const { file, hits } of findings) {
    console.log(`  ${file}`);
    for (const hit of hits) console.log(`    ${hit}`);
  }

  if (hasApprovalLabel(process.env.MIGRATION_GATE_PR_LABELS)) {
    console.log(`\n✅ Label "${APPROVAL_LABEL}" présent sur la PR — migration approuvée explicitement.`);
    return;
  }

  console.log(
    `\n❌ Cette PR modifie une migration potentiellement destructive sans le label ` +
      `"${APPROVAL_LABEL}". Vérifier l'impact (perte de données, downtime) puis poser ` +
      `le label sur la PR pour débloquer ce job.`
  );
  process.exitCode = 1;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main();
}
