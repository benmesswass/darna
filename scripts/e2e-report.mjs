/**
 * Télécharge et ouvre le dernier rapport Allure (job `e2e`, workflow CI) pour
 * la branche courante — remplace le clic manuel (page du run → résumé →
 * télécharger le zip → dézipper → lancer un serveur) par une seule commande.
 *
 * Le rapport CI est généré en mode `--single-file` (cf. .github/workflows/ci.yml) :
 * un unique index.html autonome, ouvrable directement (pas de serveur requis).
 *
 * Bascule sur le compte gh personnel (darna) puis revient sur le compte pro —
 * mêmes deux comptes que ceux utilisés manuellement tout au long du projet.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = "benmesswass/darna";
const PERSONAL_GH_USER = "benmesswass";
const PRO_GH_USER = "dt-wassim-ben-messaoud";

function sh(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8" }).trim();
}

const branch = sh("git", ["rev-parse", "--abbrev-ref", "HEAD"]);

execFileSync("gh", ["auth", "switch", "--user", PERSONAL_GH_USER], { stdio: "ignore" });

try {
  console.log(`Recherche du dernier run CI sur "${branch}"...`);
  const runsJson = sh("gh", [
    "run", "list",
    "--repo", REPO,
    "--branch", branch,
    "--workflow", "CI",
    "--json", "databaseId,status,conclusion,createdAt",
    "--limit", "10",
  ]);
  const run = JSON.parse(runsJson).find((r) => r.status === "completed");

  if (!run) {
    console.error(`Aucun run terminé pour la branche "${branch}".`);
    process.exit(1);
  }
  console.log(`Run ${run.databaseId} (${run.conclusion}, ${run.createdAt})`);

  const dest = mkdtempSync(join(tmpdir(), "darna-allure-"));
  console.log("Téléchargement du rapport Allure...");
  execFileSync(
    "gh",
    ["run", "download", String(run.databaseId), "--repo", REPO, "--name", "allure-report", "--dir", dest],
    { stdio: "inherit" }
  );

  const indexPath = join(dest, "index.html");
  if (!existsSync(indexPath)) {
    console.error(`index.html introuvable dans ${dest}`);
    process.exit(1);
  }

  console.log(`Ouverture de ${indexPath}`);
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  execFileSync(opener, [indexPath], { stdio: "inherit" });
} finally {
  execFileSync("gh", ["auth", "switch", "--user", PRO_GH_USER], { stdio: "ignore" });
}
