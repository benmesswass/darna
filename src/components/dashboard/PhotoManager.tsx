"use client";

import Image from "next/image";
import { useActionState, useRef } from "react";
import {
  addPhotosAction,
  deletePhotoAction,
  setCoverPhotoAction,
  type PhotoFormState,
} from "@/actions/properties";
import { useT } from "@/components/i18n/LocaleProvider";
import { CloseIcon, StarIcon } from "@/components/icons";

export type ManagedPhoto = {
  id: string;
  url: string;
  alt: string;
  position: number;
};

/**
 * Compression côté client avant upload : redimensionne à 1920 px max et
 * réencode en JPEG. Une photo de téléphone de 6 Mo part en ~400 Ko —
 * essentiel sur les réseaux mobiles tunisiens, et reste sous la limite
 * de corps des Server Actions.
 */
async function compressImage(file: File): Promise<File> {
  // Déjà léger : on ne touche pas.
  if (file.size < 600 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const MAX_EDGE = 1920;
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    // Format non décodable par le navigateur : le serveur tranchera.
    return file;
  }
}

/** Gestion des photos d'une annonce : ajout (upload), couverture, suppression. */
export function PhotoManager({
  propertyId,
  photos,
}: {
  propertyId: string;
  photos: ManagedPhoto[];
}) {
  const fr = useT();
  const [state, action, pending] = useActionState<PhotoFormState, FormData>(
    addPhotosAction,
    undefined
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink/50">{fr.annonceForm.photosAide}</p>

      {/* Grille des photos existantes */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <li
            key={photo.id}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-darna/10"
          >
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 50vw, 200px"
              className="object-cover"
            />
            {index === 0 ? (
              <span className="absolute start-2 top-2 rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold text-darna-dark">
                {fr.annonceForm.couverture}
              </span>
            ) : (
              <form action={setCoverPhotoAction} className="absolute start-2 top-2">
                <input type="hidden" name="photoId" value={photo.id} />
                <button
                  type="submit"
                  title={fr.annonceForm.definirCouverture}
                  className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-darna opacity-0 transition group-hover:opacity-100"
                >
                  <StarIcon width={10} height={10} />
                  {fr.annonceForm.definirCouverture}
                </button>
              </form>
            )}
            <form action={deletePhotoAction} className="absolute end-2 top-2">
              <input type="hidden" name="photoId" value={photo.id} />
              <button
                type="submit"
                title={fr.annonceForm.supprimerPhoto}
                aria-label={fr.annonceForm.supprimerPhoto}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
              >
                <CloseIcon width={12} height={12} />
              </button>
            </form>
          </li>
        ))}
      </ul>

      {/* Ajout de photos */}
      <form
        action={action}
        className="rounded-2xl border border-dashed border-darna/25 bg-cream/60 p-4"
      >
        {state?.error ? (
          <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
            {state.error}
          </p>
        ) : null}
        {state?.success ? (
          <p role="status" className="mb-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
            {state.success}
          </p>
        ) : null}
        <input type="hidden" name="propertyId" value={propertyId} />
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
            onChange={async (e) => {
              // Compresse à la sélection, puis remplace les fichiers de l'input.
              const input = e.currentTarget;
              const files = [...(input.files ?? [])];
              if (files.length === 0) return;
              const compressed = await Promise.all(files.map(compressImage));
              const dt = new DataTransfer();
              compressed.forEach((f) => dt.items.add(f));
              input.files = dt.files;
            }}
            className="text-sm text-ink/70 file:me-3 file:rounded-full file:border-0 file:bg-darna file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-darna-light"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-sand px-5 py-2.5 text-sm font-bold text-darna-dark transition hover:bg-sand-light disabled:opacity-60"
          >
            {pending ? fr.common.chargement : fr.annonceForm.ajouterPhotos}
          </button>
        </div>
      </form>
    </div>
  );
}
