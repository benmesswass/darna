"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { compressImage } from "@/lib/image-compress";
import { MAX_PHOTOS_PER_PROPERTY } from "@/lib/constants";
import { CameraIcon, CloseIcon, StarIcon } from "@/components/icons";

type Item = { file: File; url: string };

/**
 * Zone de dépôt de photos à la création d'une annonce : glisser-déposer ou
 * parcourir, aperçu en vignettes (la 1re = couverture), retrait avant
 * publication. Compresse à la sélection (réseaux mobiles) et tient à jour un
 * `<input type="file" name="photos">` caché que le formulaire sérialise.
 *
 * Composant non contrôlé côté données fichiers : l'état vit ici, le parent est
 * seulement notifié du nombre de photos (pour activer/désactiver « Publier »).
 */
export function PhotoDropzone({
  onCountChange,
}: {
  onCountChange?: (count: number) => void;
}) {
  const fr = useT();
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  // Input sérialisé par le formulaire (name="photos") — synchronisé sur `items`.
  const hiddenRef = useRef<HTMLInputElement>(null);
  // Input invisible servant uniquement de sélecteur natif (sans name).
  const pickerRef = useRef<HTMLInputElement>(null);

  // Réinjecte les fichiers retenus dans l'input sérialisé + notifie le parent.
  useEffect(() => {
    if (hiddenRef.current) {
      const dt = new DataTransfer();
      items.forEach((it) => dt.items.add(it.file));
      hiddenRef.current.files = dt.files;
    }
    onCountChange?.(items.length);
  }, [items, onCountChange]);

  const full = items.length >= MAX_PHOTOS_PER_PROPERTY;

  async function addFiles(list: FileList | null) {
    const incoming = [...(list ?? [])].filter((f) => f.type.startsWith("image/"));
    if (incoming.length === 0) return;
    setBusy(true);
    // Limite indicative avant compression ; le plafond ferme est réappliqué
    // dans l'updater (sur `prev.length`) pour rester correct en cas d'ajouts
    // rapprochés.
    const room = Math.max(0, MAX_PHOTOS_PER_PROPERTY - items.length);
    const compressed = await Promise.all(incoming.slice(0, room).map(compressImage));
    setItems((prev) => {
      const free = Math.max(0, MAX_PHOTOS_PER_PROPERTY - prev.length);
      const added = compressed
        .slice(0, free)
        .map((file) => ({ file, url: URL.createObjectURL(file) }));
      return [...prev, ...added];
    });
    setBusy(false);
  }

  function removeAt(i: number) {
    setItems((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-ink/70">
          {fr.annonceForm.photosTitre}
        </span>
        <span className="text-xs font-medium text-ink/45">
          {items.length}/{MAX_PHOTOS_PER_PROPERTY}
        </span>
      </div>
      <p className="text-xs text-ink/50">{fr.annonceForm.photosAccroche}</p>

      {/* Zone de dépôt */}
      <button
        type="button"
        onClick={() => pickerRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!full) addFiles(e.dataTransfer.files);
        }}
        disabled={full}
        className={[
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
          dragging
            ? "border-darna bg-darna/5"
            : "border-darna/25 bg-cream/50 hover:border-darna/50 hover:bg-cream",
          full ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        ].join(" ")}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-darna/10 text-darna">
          <CameraIcon width={22} height={22} />
        </span>
        <span className="text-sm font-bold text-darna">
          {fr.annonceForm.photosDeposer}
        </span>
        <span className="text-xs text-ink/50">{fr.annonceForm.photosDeposerAide}</span>
        <span className="mt-1 rounded-full bg-darna px-4 py-1.5 text-xs font-bold text-white">
          {busy ? fr.common.chargement : fr.annonceForm.photosParcourir}
        </span>
      </button>

      {/* Sélecteur natif (caché) + input sérialisé par le formulaire (caché) */}
      <input
        ref={pickerRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = ""; // permet de re-sélectionner le même fichier
        }}
      />
      <input ref={hiddenRef} type="file" name="photos" multiple className="hidden" />

      {/* Aperçu des photos retenues */}
      {items.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((it, i) => (
            <li key={it.url}>
              <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-darna/10">
                <Image
                  src={it.url}
                  alt={`Photo ${i + 1}`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 33vw, 160px"
                  className="object-cover"
                />
                {i === 0 ? (
                  <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold text-darna-dark">
                    <StarIcon width={10} height={10} />
                    {fr.annonceForm.couverture}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  title={fr.annonceForm.supprimerPhoto}
                  aria-label={fr.annonceForm.supprimerPhoto}
                  className="absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                >
                  <CloseIcon width={12} height={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-xs text-ink/40">{fr.annonceForm.photosCreationAide}</p>
    </div>
  );
}
