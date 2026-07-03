"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/components/i18n/LocaleProvider";
import { CloseIcon } from "@/components/icons";
import type { MapMarker } from "./types";

/** Placeholder localisé : composant dédié, car `dynamic()` vit au niveau module. */
function MapLoading() {
  const fr = useT();
  return (
    <div className="flex h-full w-full items-center justify-center bg-darna/5 text-sm text-body/50">
      {fr.search.chargementCarte}
    </div>
  );
}

// Leaflet manipule `window` : chargement exclusivement côté client.
const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => <MapLoading />,
});

/** Icône « agrandir » (coins en flèches), symétrique → pas de variante RTL. */
function ExpandIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 9V5a1 1 0 0 1 1-1h4" />
      <path d="M20 9V5a1 1 0 0 0-1-1h-4" />
      <path d="M4 15v4a1 1 0 0 0 1 1h4" />
      <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
    </svg>
  );
}

/** Icône filtres (curseurs). */
function FilterIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6h16M4 12h10M4 18h6" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="14" cy="18" r="2" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3 py-2 text-sm outline-none focus:border-darna";

/**
 * Carte des annonces. Rendue inline (fiche annonce ou panneau de recherche),
 * elle s'agrandit « en avant-plan » dans une modale centrée (la page reste
 * visible, floutée, derrière). La modale ajoute un panneau de filtres côté
 * carte (prix, vérifié, note) appliqué aux marqueurs côté client.
 */
export function PropertyMap({ markers }: { markers: MapMarker[] }) {
  const fr = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filtres (appliqués aux marqueurs déjà chargés de la page).
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  // Le filtrage n'a de sens qu'à partir de 2 annonces.
  const filterable = markers.length > 1;

  const filtered = useMemo(() => {
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    return markers.filter(
      (m) =>
        (min == null || m.price >= min) &&
        (max == null || m.price <= max) &&
        (!verifiedOnly || m.verified) &&
        (minRating === 0 || (m.rating != null && m.rating >= minRating))
    );
  }, [markers, priceMin, priceMax, verifiedOnly, minRating]);

  const resetFilters = () => {
    setPriceMin("");
    setPriceMax("");
    setVerifiedOnly(false);
    setMinRating(0);
  };

  // Portail : on attend le montage client.
  useEffect(() => setMounted(true), []);

  // Ouverture : verrou du scroll body, échap, focus géré et restitué,
  // + animation d'entrée (fondu + léger zoom) à la frame suivante.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const raf = window.requestAnimationFrame(() => setShown(true));
    const focusId = window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(raf);
      window.clearTimeout(focusId);
      setShown(false);
      setShowFilters(false);
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open]);

  const ratingOptions = [0, 3, 4, 4.5];

  return (
    <div className="relative h-full w-full">
      <MapInner markers={markers} />

      {/* Bouton d'agrandissement — au-dessus des panneaux Leaflet, hors zoom (top-start) et attribution (bottom-end) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={fr.search.agrandirCarte}
        title={fr.search.agrandirCarte}
        className="absolute end-3 top-3 z-[500] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-heading shadow-lg ring-1 ring-darna/10 backdrop-blur transition hover:bg-surface"
      >
        <ExpandIcon />
      </button>

      {open && mounted
        ? createPortal(
            // Voile : floute la vraie page des annonces derrière, clic = fermeture.
            <div
              role="dialog"
              aria-modal="true"
              aria-label={fr.search.agrandirCarte}
              onClick={() => setOpen(false)}
              className={`fixed inset-0 z-[1100] flex items-center justify-center bg-ink/30 p-4 backdrop-blur-md transition-opacity duration-200 ease-out sm:p-6 md:p-10 ${
                shown ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Panneau carte centré, inséré dans la page (pas plein écran) */}
              <div
                onClick={(e) => e.stopPropagation()}
                className={`relative flex h-full max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl ring-1 ring-darna/10 transition-all duration-200 ease-out ${
                  shown ? "scale-100 opacity-100" : "scale-95 opacity-0"
                }`}
              >
                {/* Barre supérieure : compteur · filtres (mobile) · fermer */}
                <div className="flex items-center gap-3 border-b border-darna/10 px-4 py-3">
                  {filterable ? (
                    <button
                      type="button"
                      onClick={() => setShowFilters((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-full border border-darna/15 px-3 py-1.5 text-sm font-semibold text-heading transition hover:bg-darna/5 md:hidden"
                    >
                      <FilterIcon />
                      {fr.search.filtres}
                    </button>
                  ) : null}
                  <span className="text-sm font-semibold text-heading">
                    {fr.search.resultats(filtered.length)}
                  </span>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={fr.search.fermerCarte}
                    title={fr.search.fermerCarte}
                    className="ms-auto flex h-10 w-10 items-center justify-center rounded-full bg-darna/5 text-heading transition hover:bg-darna hover:text-white"
                  >
                    <CloseIcon width={20} height={20} />
                  </button>
                </div>

                {/* Corps : panneau de filtres + carte */}
                <div className="relative flex flex-1 overflow-hidden">
                  {filterable ? (
                    <aside
                      className={`${
                        showFilters ? "flex" : "hidden"
                      } absolute inset-y-0 start-0 z-[20] w-72 max-w-[85%] flex-col gap-5 overflow-y-auto border-e border-darna/10 bg-surface p-5 shadow-xl md:relative md:flex md:max-w-none md:shadow-none`}
                    >
                      {/* Prix */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-body/60">
                          {fr.search.prixMin} / {fr.search.prixMax}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={priceMin}
                            onChange={(e) => setPriceMin(e.target.value)}
                            placeholder={fr.search.prixMin}
                            className={inputClass}
                          />
                          <span className="text-body/40">–</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value)}
                            placeholder={fr.search.prixMax}
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Note minimale */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-body/60">
                          {fr.search.noteMinimale}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {ratingOptions.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setMinRating(r)}
                              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                                minRating === r
                                  ? "bg-darna text-white"
                                  : "bg-darna/5 text-heading hover:bg-darna/10"
                              }`}
                            >
                              {r === 0 ? fr.search.toutesNotes : fr.search.noteMinPlus(r)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Vérifiés uniquement */}
                      <label className="flex cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={verifiedOnly}
                          onChange={(e) => setVerifiedOnly(e.target.checked)}
                          className="h-4 w-4 accent-darna"
                        />
                        <span className="text-sm font-medium text-body">
                          {fr.search.verifiesUniquement}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-auto self-start text-sm font-semibold text-heading underline-offset-2 hover:underline"
                      >
                        {fr.search.reinitialiser}
                      </button>
                    </aside>
                  ) : null}

                  {/* Voile mobile : ferme le panneau de filtres au clic hors zone */}
                  {filterable && showFilters ? (
                    <button
                      type="button"
                      aria-label={fr.search.fermerCarte}
                      onClick={() => setShowFilters(false)}
                      className="absolute inset-0 z-[10] bg-ink/10 md:hidden"
                    />
                  ) : null}

                  <div className="relative flex-1">
                    <MapInner markers={filtered} />
                    {filtered.length === 0 ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-heading shadow-lg ring-1 ring-darna/10">
                          {fr.search.aucunResultatTitre}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
