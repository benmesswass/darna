"use client";

import Image from "next/image";
import { useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { ImageGalleryModal, type GalleryImage } from "./ImageGalleryModal";

/**
 * Mosaïque type Airbnb (couverture + vignettes) qui ouvre la galerie
 * immersive plein écran au clic, sur l'image cliquée.
 */
export function PropertyGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title?: string;
}) {
  const fr = useT();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);
  const count = images.length;

  if (count === 0) {
    return (
      <div className="mt-6 flex h-64 items-center justify-center rounded-3xl bg-white text-sm text-ink/50 ring-1 ring-darna/10">
        {fr.property.gallery.aucunePhoto}
      </div>
    );
  }

  const openAt = (i: number) => {
    setStart(i);
    setOpen(true);
  };

  const cover = images[0];
  // Jusqu'à 2 vignettes à droite (desktop), comme la mosaïque Airbnb.
  const thumbs = images.slice(1, 3);
  const remaining = count - 3;

  return (
    <>
      <div className="group/gallery relative mt-6">
        <div className="grid h-[300px] grid-cols-1 gap-2 overflow-hidden rounded-3xl sm:h-[460px] sm:grid-cols-3 sm:grid-rows-2">
          {/* Couverture */}
          <button
            type="button"
            onClick={() => openAt(0)}
            aria-label={fr.property.gallery.allerA(1)}
            className={`group/tile relative overflow-hidden ${
              count === 1
                ? "sm:col-span-3 sm:row-span-2"
                : count === 2
                  ? "sm:col-span-2 sm:row-span-2"
                  : "sm:col-span-2 sm:row-span-2"
            }`}
          >
            <Image
              src={cover.url}
              alt={cover.alt}
              fill
              sizes="(max-width: 640px) 100vw, 66vw"
              className="object-cover transition duration-300 group-hover/tile:scale-[1.03]"
              priority
            />
            <span className="absolute inset-0 bg-ink/0 transition group-hover/tile:bg-ink/10" />
          </button>

          {/* Vignettes (desktop) */}
          {thumbs.map((photo, i) => {
            const realIndex = i + 1;
            const isLastThumb = i === thumbs.length - 1;
            const showMore = isLastThumb && remaining > 0;
            return (
              <button
                key={realIndex}
                type="button"
                onClick={() => openAt(realIndex)}
                aria-label={fr.property.gallery.allerA(realIndex + 1)}
                className={`group/tile relative hidden overflow-hidden sm:block ${
                  count === 2 ? "sm:row-span-2" : ""
                }`}
              >
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  sizes="33vw"
                  className="object-cover transition duration-300 group-hover/tile:scale-[1.03]"
                />
                <span className="absolute inset-0 bg-ink/0 transition group-hover/tile:bg-ink/10" />
                {showMore ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-lg font-bold text-white backdrop-blur-[2px]">
                    +{remaining}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Bouton « Voir les N photos » */}
        {count > 1 ? (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="absolute bottom-3 end-3 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-ink shadow-lg ring-1 ring-black/5 backdrop-blur transition hover:bg-white active:scale-95"
          >
            <GridIcon />
            {fr.property.gallery.voirToutes(count)}
          </button>
        ) : null}

        {/* Compteur sur mobile (couverture seule visible) */}
        <span className="absolute bottom-3 start-3 rounded-full bg-ink/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur sm:hidden">
          {fr.property.gallery.compteur(1, count)}
        </span>
      </div>

      <ImageGalleryModal
        images={images}
        open={open}
        initialIndex={start}
        title={title}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function GridIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
