/**
 * P2.3 (ROADMAP.md, XSS stocké) — garde-fou statique : `dangerouslySetInnerHTML`
 * ne doit jamais apparaître ailleurs que dans l'unique exception documentée
 * (CLAUDE.md « Sécurité » : src/components/seo/JsonLd.tsx, contenu JSON-LD
 * échappé, jamais du HTML exécutable). Tout le contenu utilisateur (titre,
 * description, avis, message) repose sur l'échappement JSX par défaut de
 * React — ce test empêche qu'un futur composant contourne cette garantie
 * sans qu'on s'en aperçoive.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = join(__dirname, "..", "src");
const ALLOWED = new Set(["src/components/seo/JsonLd.tsx"]);
const CODE_FILE_RE = /\.(ts|tsx)$/;
// Prop JSX (`dangerouslySetInnerHTML={...}`) ou clé d'objet
// (`dangerouslySetInnerHTML: {...}`) — jamais une simple mention en
// commentaire/doc (ex. src/lib/theme.ts explique pourquoi il NE l'utilise
// PAS), qui ne doit pas déclencher ce garde-fou.
const USAGE_RE = /dangerouslySetInnerHTML\s*[=:]/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (CODE_FILE_RE.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("garde-fou XSS — dangerouslySetInnerHTML", () => {
  it("n'apparaît nulle part sous src/ sauf l'exception documentée", () => {
    const offenders = walk(SRC_DIR)
      .filter((file) => USAGE_RE.test(readFileSync(file, "utf8")))
      .map((file) => relative(join(__dirname, ".."), file).replace(/\\/g, "/"))
      .filter((relPath) => !ALLOWED.has(relPath));

    expect(offenders, `nouvelle(s) utilisation(s) non revue(s) : ${offenders.join(", ")}`).toEqual([]);
  });

  it("l'exception documentée existe toujours (sinon l'allowlist ci-dessus est morte)", () => {
    const jsonLd = readFileSync(join(SRC_DIR, "components/seo/JsonLd.tsx"), "utf8");
    expect(jsonLd).toContain("dangerouslySetInnerHTML");
  });
});
