"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  addFavoriteAction,
  createFolderWithFavoriteAction,
  removeFavoriteAction,
} from "@/actions/properties";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import type { FavoriteFolderLite } from "@/lib/favorites";
import { CheckIcon, FolderIcon, HeartIcon, PlusIcon } from "@/components/icons";

/**
 * Cœur favori + sélecteur de dossiers.
 *
 * - Pas encore en favori → le clic ouvre un popover : enregistrer « Sans
 *   dossier », dans un dossier existant, ou créer un nouveau dossier dont le
 *   nom est pré-rempli « Ville, Mois Année » (localisé) et reste éditable.
 * - Déjà en favori → le clic retire directement (choix produit).
 *
 * Le popover est rendu en portail (position: fixed) pour échapper au
 * `overflow-hidden` des cartes et aux contextes d'empilement.
 */
const PANEL_WIDTH = 256;

function defaultFolderName(city: string, locale: string): string {
  const now = new Date();
  const month = new Intl.DateTimeFormat(locale, { month: "long" }).format(now);
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
  return `${city}, ${monthCap} ${now.getFullYear()}`;
}

export function FavoriteButton({
  propertyId,
  city,
  isFavorited,
  folders,
  size = "md",
  className = "",
}: {
  propertyId: string;
  city: string;
  isFavorited: boolean;
  folders: FavoriteFolderLite[];
  size?: "sm" | "md";
  className?: string;
}) {
  const fr = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [favorited, setFavorited] = useState(isFavorited);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number; placeUp: boolean } | null>(null);

  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // L'état serveur fait foi quand il change (navigation, refresh).
  useEffect(() => setFavorited(isFavorited), [isFavorited]);

  const iconSize = size === "sm" ? 16 : 18;

  function positionPanel() {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const left = Math.max(
      8,
      Math.min(r.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8)
    );
    const placeUp = r.bottom > window.innerHeight * 0.62;
    const top = placeUp ? r.top : r.bottom;
    setCoords({ top, left, placeUp });
  }

  // Reposition au scroll / resize tant que le popover est ouvert.
  useEffect(() => {
    if (!open) return;
    positionPanel();
    const onMove = () => positionPanel();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  // Fermeture clic-extérieur + Échap.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      closePanel();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePanel();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function closePanel() {
    setOpen(false);
    setCreating(false);
  }

  function handleHeartClick(e: React.MouseEvent) {
    // Le cœur peut être superposé à un lien : on neutralise la navigation.
    e.preventDefault();
    e.stopPropagation();
    if (favorited) {
      setFavorited(false);
      startTransition(async () => {
        await removeFavoriteAction(propertyId);
        router.refresh();
      });
      return;
    }
    setOpen((o) => !o);
  }

  function saveToFolder(folderId: string | null) {
    setFavorited(true);
    closePanel();
    startTransition(async () => {
      await addFavoriteAction(propertyId, folderId);
      router.refresh();
    });
  }

  function startCreating() {
    setName(defaultFolderName(city, locale));
    setCreating(true);
  }

  function confirmCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setFavorited(true);
    closePanel();
    startTransition(async () => {
      await createFolderWithFavoriteAction(propertyId, trimmed);
      router.refresh();
    });
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleHeartClick}
        disabled={isPending}
        aria-label={favorited ? fr.property.favoriRetirer : fr.property.favoriAjouter}
        aria-expanded={open}
        aria-haspopup="menu"
        title={favorited ? fr.property.favoriRetirer : fr.property.favoriAjouter}
        className={`inline-flex items-center justify-center rounded-full p-2 ring-1 shadow-sm backdrop-blur transition disabled:opacity-60 ${
          favorited
            ? "bg-red-50 text-red-600 ring-red-200"
            : "bg-white/90 text-ink/50 ring-darna/15 hover:text-red-500"
        } ${className}`}
      >
        <HeartIcon
          width={iconSize}
          height={iconSize}
          fill={favorited ? "currentColor" : "none"}
        />
      </button>

      {open && coords
        ? createPortal(
            <div
              ref={panelRef}
              role="menu"
              dir={locale === "ar" ? "rtl" : "ltr"}
              style={{
                position: "fixed",
                left: coords.left,
                width: PANEL_WIDTH,
                ...(coords.placeUp
                  ? { top: coords.top, transform: "translateY(-100%)", marginTop: -8 }
                  : { top: coords.top, marginTop: 8 }),
              }}
              className="z-[1000] overflow-hidden rounded-2xl bg-white text-start shadow-xl ring-1 ring-darna/10"
            >
              {!creating ? (
                <div className="max-h-80 overflow-auto p-1.5">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
                    {fr.property.favoriChoisirDossier}
                  </p>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => saveToFolder(null)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink/80 transition hover:bg-darna/5"
                  >
                    <HeartIcon width={16} height={16} />
                    <span className="truncate">{fr.property.favoriSansDossier}</span>
                  </button>

                  {folders.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="menuitem"
                      onClick={() => saveToFolder(f.id)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink/80 transition hover:bg-darna/5"
                    >
                      <FolderIcon width={16} height={16} className="shrink-0 text-darna/60" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={startCreating}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-xl border-t border-darna/5 px-3 py-2.5 text-sm font-medium text-darna transition hover:bg-darna/5"
                  >
                    <PlusIcon width={16} height={16} className="shrink-0" />
                    <span className="truncate">{fr.property.favoriNouveauDossier}</span>
                  </button>
                </div>
              ) : (
                <div className="p-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-ink/40">
                    {fr.property.favoriNomDossier}
                  </label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        confirmCreate();
                      }
                    }}
                    maxLength={80}
                    className="mt-1.5 w-full rounded-xl border border-darna/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-darna/40 focus:ring-2 focus:ring-darna/15"
                  />
                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCreating(false)}
                      className="flex-1 rounded-xl px-3 py-2 text-sm text-ink/60 ring-1 ring-darna/15 transition hover:bg-darna/5"
                    >
                      {fr.property.favoriAnnuler}
                    </button>
                    <button
                      type="button"
                      onClick={confirmCreate}
                      disabled={!name.trim()}
                      className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-darna px-3 py-2 text-sm font-medium text-white transition hover:bg-darna/90 disabled:opacity-50"
                    >
                      <CheckIcon width={16} height={16} />
                      {fr.property.favoriCreerDossier}
                    </button>
                  </div>
                </div>
              )}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
