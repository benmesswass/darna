/**
 * Rotation de KYC_ENC_KEY (ROADMAP.md §P3.4) — re-chiffre toutes les CIN
 * (User.cin) de l'ancienne clé vers une nouvelle, et recalcule cinHash (le
 * pepper de hashCin() est aussi KYC_ENC_KEY, cf. src/lib/crypto.ts).
 *
 * Usage :
 *   KYC_ENC_KEY=<ancienne> NEW_KYC_ENC_KEY=<nouvelle> npx tsx scripts/rotate-kyc-key.ts
 *   KYC_ENC_KEY=<ancienne> NEW_KYC_ENC_KEY=<nouvelle> DRY_RUN=true npx tsx scripts/rotate-kyc-key.ts
 *
 * Procédure complète : voir docs/SECURITE_DONNEES.md §3 (ordre des opérations,
 * fenêtre de maintenance, vérifications avant/après — NE PAS lancer ce script
 * sans avoir lu ce runbook, l'ordre des étapes compte).
 *
 * Sécurité : ne JAMAIS logger une CIN en clair, même en cas d'erreur. Échec
 * immédiat (pas de "continuer sur les autres lignes") — un chiffrement à
 * moitié fait est plus dangereux qu'un arrêt net : on doit savoir avec
 * certitude jusqu'où la rotation est allée.
 */
import { PrismaClient } from "@prisma/client";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const prisma = new PrismaClient();
const PREFIX = "enc:v1:";
const BATCH_SIZE = 50;

function key32(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

function decryptWith(stored: string, secret: string): string {
  if (!stored.startsWith(PREFIX)) return stored; // legacy en clair
  const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split(":");
  const decipher = createDecipheriv("aes-256-gcm", key32(secret), Buffer.from(ivB64, "base64"), {
    authTagLength: 16,
  });
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function encryptWith(plain: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key32(secret), iv, { authTagLength: 16 });
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

function hashCinWith(cin: string, secret: string): string {
  const normalized = cin.replace(/\D/g, "");
  return createHash("sha256").update(`cin:${normalized}:${secret}`).digest("hex");
}

async function main() {
  const oldKey = process.env.KYC_ENC_KEY;
  const newKey = process.env.NEW_KYC_ENC_KEY;
  const dryRun = process.env.DRY_RUN === "true";

  if (!oldKey) throw new Error("KYC_ENC_KEY (ancienne clé) requise.");
  if (!newKey) throw new Error("NEW_KYC_ENC_KEY (nouvelle clé) requise.");
  if (oldKey === newKey) throw new Error("NEW_KYC_ENC_KEY doit différer de KYC_ENC_KEY.");

  const total = await prisma.user.count({ where: { cin: { not: null } } });
  console.log(`${total} compte(s) avec une CIN à faire tourner.${dryRun ? " [DRY RUN]" : ""}`);

  let done = 0;
  let cursor: string | undefined;
  for (;;) {
    const batch = await prisma.user.findMany({
      where: { cin: { not: null } },
      select: { id: true, cin: true },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (batch.length === 0) break;

    for (const u of batch) {
      const plain = decryptWith(u.cin!, oldKey);
      const reEncrypted = encryptWith(plain, newKey);
      const newHash = hashCinWith(plain, newKey);
      if (!dryRun) {
        await prisma.user.update({
          where: { id: u.id },
          data: { cin: reEncrypted, cinHash: newHash },
        });
      }
      done += 1;
    }
    cursor = batch[batch.length - 1].id;
    console.log(`${done}/${total} traité(s).`);
  }

  console.log(dryRun ? "Dry run terminé, rien écrit." : "Rotation terminée.");
}

main()
  .catch((e) => {
    console.error("Rotation interrompue :", e instanceof Error ? e.message : e);
    console.error(
      "Aucune CIN n'est loguée. Vérifier manuellement en base jusqu'où la rotation est allée avant de relancer."
    );
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
