"use client";

import Image from "next/image";
import { useActionState, useRef } from "react";
import {
  addPhotosAction,
  deletePhotoAction,
  setCoverPhotoAction,
  updatePhotoCaptionAction,
  type PhotoFormState,
} from "@/actions/properties";
import { useT } from "@/components/i18n/LocaleProvider";
import { CheckIcon, CloseIcon, StarIcon } from "@/components/icons";

export type ManagedPhoto = {
  id: string;
  url: string;
  alt: string;
  caption: string | null;
  position: number;
};

/**
 * Champ de légende d'une photo : enregistrement autonome via Server Action
 * (un état par photo), avec accusé de réception discret.
 */
function PhotoCaptionField({ photo }: { photo: ManagedPhoto }) {
  const fr = useT();
  const [state, action, pending] = useActionState<PhotoFormState, FormData>(
    updatePhotoCaptionAction,
    undefined
  );

  return (
    <form action={action} className="mt-2 space-y-1.5">
      <input type="hidden" name="photoId" value={photo.id} />
      <label className="sr-only" htmlFor={`caption-${photo.id}`}>
        {fr.annonceForm.legendePhoto}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          id={`caption-${photo.id}`}
          name="caption"
          type="text"
          maxLength={140}
          defaultValue={photo.caption ?? ""}
          placeholder={fr.annonceForm.legendePlaceholder}
          className="min-w-0 flex-1 rounded-lg bg-cream px-2.5 py-1.5 text-xs text-ink ring-1 ring-darna/10 placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-darna/40"
        />
        <button
          type="submit"
          disabled={pending}
          title={fr.annonceForm.legendeEnregistrer}
          aria-label={fr.annonceForm.legendeEnregistrer}
          className="shrink-0 rounded-lg bg-darna px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-darna-light disabled:opacity-60"
        >
          {state?.success ? (
            <CheckIcon width={14} height={14} strokeWidth={3} />
          ) : (
            fr.annonceForm.legendeEnregistrer
          )}
        </button>
      </div>
    </form>
  );
}

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
      <p className="text-xs text-ink/50">{fr.annonceForm.legendeAide}</p>

      {/* Grille des photos existantes */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-darna/10">
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
            </div>
            <PhotoCaptionField photo={photo} />
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
