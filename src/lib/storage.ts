import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAX_PHOTO_SIZE } from "@/lib/constants";

/**
 * Abstraction de stockage des images — seam d'architecture.
 *
 * En démo : driver disque (`/public/uploads`, serveur persistant requis).
 * En pré-prod/prod : brancher un adapter S3/R2 ici, sélectionné par
 * `STORAGE_DRIVER`, SANS toucher aux appelants (qui passent par src/lib/uploads).
 *
 * Module SERVEUR uniquement (node:fs/crypto).
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

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Driver disque (V0/démo). Validation stricte : type MIME autorisé, taille
 * ≤ 5 Mo ET signature binaire (magic bytes) — le MIME annoncé par le client ne
 * suffit jamais. Noms de fichiers aléatoires : aucun path traversal possible.
 */
const diskStorage: StorageAdapter = {
  async save(file: File): Promise<string | null> {
    const ext = ALLOWED_TYPES[file.type];
    if (!ext || file.size === 0 || file.size > MAX_PHOTO_SIZE) return null;

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidMagicBytes(buffer, file.type)) return null;

    const name = `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.${ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), buffer);
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

/** Driver sélectionné. Point de bascule unique vers S3/R2 en pré-prod. */
export const storage: StorageAdapter = diskStorage;
