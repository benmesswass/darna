/**
 * Vérifie l'intégrité de la chaîne de hachage de l'audit log (ROADMAP.md
 * §P3.5) : rejoue la chaîne en suivant les LIENS prevHash/hash (PAS l'ordre
 * createdAt — sous écriture concurrente réelle, l'ordre dans lequel un
 * writer gagne la course CAS peut différer de l'ordre dans lequel son
 * `createdAt` a été capturé ; un writer peut capturer un timestamp plus tôt
 * mais perdre la course et n'être chaîné qu'après. Vérifié empiriquement
 * avec un test de charge à 25 écritures concurrentes réelles : trier par
 * createdAt produisait de FAUSSES alertes de rupture sur des écritures
 * parfaitement légitimes. Suivre les liens de la chaîne elle-même est la
 * seule méthode correcte, indépendante de toute horloge.
 *
 * Lancement : npx tsx scripts/verify-audit-chain.ts
 * Sortie : exit 0 si la chaîne est intacte, exit 1 sinon (utilisable en CI/
 * job planifié). N'écrit jamais rien en base — lecture seule.
 */
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();
const CHAIN_ID = "singleton";
const CHAIN_GENESIS = "genesis";

function computeChainHash(entry: {
  prevHash: string;
  action: string;
  userId: string | null;
  metadataStr: string;
  success: boolean;
  createdAt: Date;
}): string {
  const payload = [
    entry.prevHash,
    entry.action,
    entry.userId ?? "",
    entry.metadataStr,
    String(entry.success),
    entry.createdAt.toISOString(),
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

type Row = {
  id: string;
  action: string;
  userId: string | null;
  metadata: string;
  success: boolean;
  createdAt: Date;
  hash: string | null;
  prevHash: string | null;
};

async function main() {
  const rows = await prisma.auditLog.findMany({
    where: { hash: { not: null } },
    select: {
      id: true,
      action: true,
      userId: true,
      metadata: true,
      success: true,
      createdAt: true,
      hash: true,
      prevHash: true,
    },
  });

  console.log(`${rows.length} ligne(s) chaînée(s) à vérifier.`);
  if (rows.length === 0) {
    console.log("Rien à vérifier (aucune ligne chaînée).");
    return;
  }

  // Index par prevHash : au plus une ligne ne devrait jamais partager le
  // même prevHash (deux lignes avec le même prevHash = fourche = altération
  // ou bug de concurrence réel, PAS un faux positif de tri).
  const byPrevHash = new Map<string, Row[]>();
  for (const row of rows) {
    const key = row.prevHash ?? "";
    const list = byPrevHash.get(key) ?? [];
    list.push(row);
    byPrevHash.set(key, list);
  }

  const breaks: string[] = [];
  for (const [prevHash, list] of byPrevHash) {
    if (list.length > 1) {
      breaks.push(
        `Fourche détectée : ${list.length} lignes partagent le même prevHash (${prevHash}) — ${list.map((r) => r.id).join(", ")}.`
      );
    }
  }

  // Marche le long de la chaîne à partir de genesis en suivant les liens.
  let expectedPrev = CHAIN_GENESIS;
  let visited = 0;
  let current = byPrevHash.get(expectedPrev)?.[0];
  while (current) {
    const recomputed = computeChainHash({
      prevHash: expectedPrev,
      action: current.action,
      userId: current.userId,
      metadataStr: current.metadata,
      success: current.success,
      createdAt: current.createdAt,
    });
    if (recomputed !== current.hash) {
      breaks.push(
        `${current.id} (${current.action}, ${current.createdAt.toISOString()}) : hash stocké ≠ hash recalculé — ligne probablement altérée après écriture.`
      );
    }
    visited += 1;
    expectedPrev = current.hash!;
    current = byPrevHash.get(expectedPrev)?.[0];
  }

  if (visited !== rows.length) {
    breaks.push(
      `${rows.length - visited} ligne(s) chaînée(s) orpheline(s) — non atteignable(s) en suivant la chaîne depuis genesis (maillon manquant ou brisé).`
    );
  }

  const state = await prisma.auditChainState.findUnique({ where: { id: CHAIN_ID } });
  if (state && state.lastHash !== expectedPrev) {
    breaks.push(
      `AuditChainState.lastHash (${state.lastHash}) ne correspond pas à la fin de chaîne recalculée (${expectedPrev}).`
    );
  }

  if (breaks.length === 0) {
    console.log(`Chaîne intacte sur ${rows.length} ligne(s).`);
    return;
  }

  console.error(`${breaks.length} rupture(s) détectée(s) :`);
  for (const b of breaks) console.error(` - ${b}`);
  process.exit(1);
}

main()
  .catch((e) => {
    console.error("Vérification interrompue :", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
