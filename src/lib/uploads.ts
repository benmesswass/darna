import { MAX_PHOTO_SIZE, MAX_PHOTOS_PER_PROPERTY } from "@/lib/constants";
import { storage } from "@/lib/storage";

/**
 * Upload d'images — façade stable au-dessus de l'abstraction de stockage
 * (src/lib/storage.ts). Les appelants serveur historiques importent toujours
 * `saveUploadedImage`/`deleteUploadedImage` ici ; le driver réel (disque en
 * démo, S3/R2 en prod) est interchangeable sans toucher à ces appelants.
 *
 * Module SERVEUR uniquement.
 */

// Réexport pour les importeurs serveur historiques (ex. actions/properties).
export { MAX_PHOTO_SIZE, MAX_PHOTOS_PER_PROPERTY };

/** Sauvegarde une image validée et retourne son URL publique, ou null si refusée. */
export function saveUploadedImage(file: File): Promise<string | null> {
  return storage.save(file);
}

/** Supprime le fichier d'une photo uploadée (best-effort, jamais bloquant). */
export function deleteUploadedImage(url: string): Promise<void> {
  return storage.delete(url);
}
