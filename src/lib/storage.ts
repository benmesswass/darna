import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import sharp from "sharp";
import { MAX_PHOTO_SIZE } from "@/lib/constants";
import { logStructured } from "@/lib/audit";
import { storageMode } from "@/lib/modes";

/**
 * Abstraction de stockage des images — seam d'architecture.
 *
 * Driver sélectionné par `STORAGE_MODE` (cf. src/lib/modes.ts) :
 *   - `local` (défaut, démo) : `/public/uploads`, serveur persistant requis.
 *   - `s3` : objet S3-compatible (Cloudflare R2 / AWS S3 / MinIO) via aws4fetch
 *     — opt-in, config `S3_*` exigée au boot par env.ts (cf. .env.example).
 * Les appelants passent toujours par src/lib/uploads (API stable) : changer de
 * driver ne touche aucun appelant.
 *
 * Module SERVEUR uniquement (node:fs/crypto + secrets S3).
 */
export interface StorageAdapter {
  /** Sauvegarde une image validée et retourne son URL publique, ou null si refusée. */
  save(file: File): Promise<string | null>;
  /** Supprime un fichier précédemment uploadé (best-effort, jamais bloquant). */
  delete(url: string): Promise<void>;
}

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function hasValidMagicBytes(buffer: Buffer, mime: string): boolean {
  if (buffer.length < 12) return false;
  switch (mime) {
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      );
    case "image/webp":
      return (
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      );
    default:
      return false;
  }
}

/**
 * Validation stricte PARTAGÉE par tous les drivers : type MIME autorisé, taille
 * ≤ MAX_PHOTO_SIZE, signature binaire (magic bytes) — le MIME annoncé par le
 * client ne suffit jamais — PUIS ré-encodage serveur via sharp (P2.7). Le
 * ré-encodage a deux effets : il supprime EXIF/GPS (sharp ne préserve les
 * métadonnées que si `.withMetadata()` est appelé, jamais le cas ici) et il
 * neutralise tout octet superflu après les données image valides (polyglot —
 * payload caché après la fin du flux JPEG/PNG/WebP), puisque seuls les pixels
 * décodés sont réencodés. Un buffer qui ne décode pas (corrompu ou pas
 * réellement une image malgré des magic bytes valides) est rejeté ici aussi.
 * Retourne le buffer validé + l'extension, ou null. Exportée pour les tests
 * (c'est la barrière de sécurité des uploads).
 */
export async function readValidatedImage(
  file: File
): Promise<{ buffer: Buffer; ext: string } | null> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext || file.size === 0 || file.size > MAX_PHOTO_SIZE) return null;

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidMagicBytes(rawBuffer, file.type)) return null;

  try {
    const image = sharp(rawBuffer);
    const buffer =
      file.type === "image/png"
        ? await image.png().toBuffer()
        : file.type === "image/webp"
          ? await image.webp().toBuffer()
          : await image.jpeg().toBuffer();
    return { buffer, ext };
  } catch {
    return null;
  }
}

/** Nom de fichier aléatoire : aucun path traversal, aucune collision. */
function randomName(ext: string): string {
  return `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.${ext}`;
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Driver disque (démo). */
const diskStorage: StorageAdapter = {
  async save(file: File): Promise<string | null> {
    const validated = await readValidatedImage(file);
    if (!validated) return null;

    const name = randomName(validated.ext);
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), validated.buffer);
    return `/uploads/${name}`;
  },

  async delete(url: string): Promise<void> {
    // Seuls les fichiers de /uploads sont supprimables (jamais les placeholders).
    if (!/^\/uploads\/[a-z0-9-]+\.(jpg|png|webp)$/.test(url)) return;
    try {
      await unlink(path.join(UPLOAD_DIR, path.basename(url)));
    } catch {
      // Fichier déjà absent : non bloquant.
    }
  },
};

type S3Config = {
  endpoint: string;
  bucket: string;
  publicUrl: string;
  client: AwsClient;
};

/** Configuration S3 lue à chaud, ou null si incomplète (cf. refine dans env.ts). */
function s3Config(): S3Config | null {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;

  const region = process.env.S3_REGION ?? "auto"; // R2 = "auto"
  const base = endpoint.replace(/\/+$/, "");
  return {
    endpoint: base,
    bucket,
    publicUrl: (process.env.S3_PUBLIC_URL ?? `${base}/${bucket}`).replace(/\/+$/, ""),
    client: new AwsClient({ accessKeyId, secretAccessKey, region, service: "s3" }),
  };
}

/**
 * Driver S3/R2 (pré-prod/prod). Signature SigV4 via aws4fetch (léger, sur
 * fetch + Web Crypto). Même validation que le disque. Toute erreur réseau/HTTP
 * est journalisée et renvoie null (jamais d'exception qui casse le flux upload).
 */
const s3Storage: StorageAdapter = {
  async save(file: File): Promise<string | null> {
    const validated = await readValidatedImage(file);
    if (!validated) return null;

    const cfg = s3Config();
    if (!cfg) {
      logStructured("error", "storage.s3_misconfigured", {});
      return null;
    }

    const key = `uploads/${randomName(validated.ext)}`;
    try {
      const res = await cfg.client.fetch(`${cfg.endpoint}/${cfg.bucket}/${key}`, {
        method: "PUT",
        // Uint8Array (backing non partagé) → compatible BodyInit de fetch.
        body: new Uint8Array(validated.buffer),
        headers: { "content-type": file.type },
      });
      if (!res.ok) {
        logStructured("error", "storage.s3_put_failed", { status: res.status, key });
        return null;
      }
    } catch (err) {
      logStructured("error", "storage.s3_put_error", { message: (err as Error).message });
      return null;
    }
    return `${cfg.publicUrl}/${key}`;
  },

  async delete(url: string): Promise<void> {
    // Même garde que le disque : on ne supprime que des clés d'upload connues.
    const match = url.match(/uploads\/[a-z0-9-]+\.(?:jpg|png|webp)$/);
    if (!match) return;

    const cfg = s3Config();
    if (!cfg) return;
    try {
      await cfg.client.fetch(`${cfg.endpoint}/${cfg.bucket}/${match[0]}`, {
        method: "DELETE",
      });
    } catch {
      // Objet déjà absent / erreur réseau : non bloquant.
    }
  },
};

/** Sélection du driver (point de bascule unique). Exportée pour les tests. */
export function selectStorage(): StorageAdapter {
  return storageMode() === "s3" ? s3Storage : diskStorage;
}

export const storage: StorageAdapter = selectStorage();
