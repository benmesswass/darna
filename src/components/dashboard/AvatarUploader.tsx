"use client";

import Image from "next/image";
import { useActionState, useRef } from "react";
import {
  removeAvatarAction,
  updateAvatarAction,
  type ProfileFormState,
} from "@/actions/profile";
import { useT } from "@/components/i18n/LocaleProvider";
import { CameraIcon, TrashIcon } from "@/components/icons";

/** Initiales (1 à 2 lettres) dérivées du nom, pour l'avatar par défaut. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Compression côté client : recadrage carré centré, redimensionné à 512 px et
 * réencodé en JPEG (~50 Ko). Une photo de profil n'a pas besoin de plus, et on
 * reste loin de la limite de corps des Server Actions.
 */
async function compressAvatar(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const SIZE = 512;
    const edge = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - edge) / 2;
    const sy = (bitmap.height - edge) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, sx, sy, edge, edge, 0, 0, SIZE, SIZE);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    if (!blob) return file;
    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  } catch {
    // Format non décodable par le navigateur : le serveur tranchera.
    return file;
  }
}

export function AvatarUploader({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const fr = useT();
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    updateAvatarAction,
    undefined
  );
  const [, removeAction, removePending] = useActionState<
    ProfileFormState,
    FormData
  >(removeAvatarAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-3">
      <form ref={formRef} action={action}>
        <div className="group relative h-28 w-28">
          <div className="h-28 w-28 overflow-hidden rounded-full bg-sand ring-4 ring-cream shadow-sm">
            {image ? (
              <Image
                src={image}
                alt={name}
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-darna-dark">
                {initials(name)}
              </span>
            )}
            {pending ? (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-darna/50 text-xs font-semibold text-white">
                {fr.common.chargement}
              </span>
            ) : null}
          </div>

          {/* Bouton appareil photo, ancré en bas de l'avatar */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending}
            aria-label={image ? fr.profil.changerPhoto : fr.profil.ajouterPhoto}
            title={image ? fr.profil.changerPhoto : fr.profil.ajouterPhoto}
            className="absolute -bottom-1 -end-1 flex h-9 w-9 items-center justify-center rounded-full bg-darna text-white shadow-md ring-2 ring-white transition hover:bg-darna-light disabled:opacity-60"
          >
            <CameraIcon width={17} height={17} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={async (e) => {
            const input = e.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            const compressed = await compressAvatar(file);
            const dt = new DataTransfer();
            dt.items.add(compressed);
            input.files = dt.files;
            formRef.current?.requestSubmit();
          }}
        />
      </form>

      {image ? (
        <form action={removeAction}>
          <button
            type="submit"
            disabled={removePending || pending}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <TrashIcon width={13} height={13} />
            {fr.profil.supprimerPhoto}
          </button>
        </form>
      ) : null}

      {state?.error ? (
        <p role="alert" className="text-center text-xs font-medium text-red-600">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
