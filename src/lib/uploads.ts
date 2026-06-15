import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAX_PHOTO_SIZE, MAX_PHOTOS_PER_PROPERTY } from "@/lib/constants";

/**
 * Upload local d'images (V0) : disque sous /public/uploads, aucun service
 * externe. Validation stricte : type MIME autorisé, taille ≤ 5 Mo ET
 * signature binaire (magic bytes) — le MIME annoncé par le client ne suffit
 * jamais. Noms de fichiers générés aléatoirement : aucun path traversal
 * possible, aucune donnée utilisateur dans le nom.
 *
 * En production : déplacer vers un stockage objet (S3/R2) + CDN.
 */

// Réexport pour les importeurs serveur historiques (ex. actions/properties).
export { MAX_PHOTO_SIZE, MAX_PHOTOS_PER_PROPERTY };

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

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Sauvegarde une image validée et retourne son URL publique, ou null si refusée. */
export async function saveUploadedImage(file: File): Promise<string | null> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext || file.size === 0 || file.size > MAX_PHOTO_SIZE) return null;

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidMagicBytes(buffer, file.type)) return null;

  const name = `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}

/** Supprime le fichier d'une photo uploadée (best-effort, jamais bloquant). */
export async function deleteUploadedImage(url: string): Promise<void> {
  // Seuls les fichiers de /uploads sont supprimables (jamais les placeholders).
  if (!/^\/uploads\/[a-z0-9-]+\.(jpg|png|webp)$/.test(url)) return;
  try {
    await unlink(path.join(UPLOAD_DIR, path.basename(url)));
  } catch {
    // Fichier déjà absent : non bloquant.
  }
}
