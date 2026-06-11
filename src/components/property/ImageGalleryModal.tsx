"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { CloseIcon } from "@/components/icons";

export type GalleryImage = {
  url: string;
  alt: string;
  caption?: string | null;
};

type Props = {
  images: GalleryImage[];
  open: boolean;
  initialIndex?: number;
  /** Titre de l'annonce, affiché en permanence en haut de la galerie. */
  title?: string;
  onClose: () => void;
};

// Courbe « snap » douce et premium (ease-out marqué).
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const TRANSITION = `transform 0.3s ${EASE}`;
const MAX_ZOOM = 3;

// Bande de vignettes (desktop) : largeurs en px et écart, en miroir des
// classes Tailwind du scrubber (vignette active `w-24` = 96px, inactive
// `w-16` = 64px). Le recentrage analytique de la bande s'appuie dessus, donc
// l'écart est piloté par cette constante (style inline `gap`) plutôt que par
// une classe, pour rester exact même pendant l'animation des tailles.
const THUMB_W = 64; // w-16 — vignette inactive
const THUMB_ACTIVE_W = 96; // w-24 — vignette active
const THUMB_GAP = 8; // écart entre vignettes

/** Petit retour haptique sur mobile, best-effort (ignoré ailleurs). */
function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.(8);
  }
}

/**
 * Galerie immersive plein écran (lightbox) — swipe + vélocité, flèches
 * clavier, zones cliquables desktop, double-tap / pinch zoom, légendes en
 * fondu, préchargement des voisines et indicateur de progression.
 *
 * Surface volontairement forcée en LTR : la mécanique de translation reste
 * déterministe quelle que soit la locale (le texte des légendes garde, lui,
 * sa direction naturelle).
 */
export function ImageGalleryModal({
  images,
  open,
  initialIndex = 0,
  title,
  onClose,
}: Props) {
  const fr = useT();
  const count = images.length;

  const [index, setIndex] = useState(initialIndex);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Bouclage : saut instantané (sans balayage) + badge « retour au début ».
  const [instant, setInstant] = useState(false);
  const [loop, setLoop] = useState<null | "start" | "end">(null);
  // Décalage horizontal de la bande de vignettes (garde l'active centrée).
  const [tx, setTx] = useState(0);

  // Légende en fondu : on diffère l'affichage pour cross-fader au changement.
  const [shownCaption, setShownCaption] = useState<string | null>(null);
  const [captionVisible, setCaptionVisible] = useState(true);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  // Suivi des pointeurs actifs (swipe à 1 doigt, pinch à 2).
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    panStart: { x: 0, y: 0 },
    pinchDist: 0,
    pinchZoom: 1,
    moved: false,
    lastTap: 0,
  });

  const clampIndex = useCallback(
    (i: number) => Math.max(0, Math.min(count - 1, i)),
    [count]
  );

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (next: number) => {
      // Boucle : au-delà de la dernière → première (et inversement).
      let target = next;
      let wrap: "start" | "end" | null = null;
      if (next > count - 1) {
        target = 0;
        wrap = "start";
      } else if (next < 0) {
        target = count - 1;
        wrap = "end";
      }
      if (target !== index) haptic();
      if (wrap) {
        // Saut instantané (le balayage ne montrerait que des slides hors fenêtre).
        setInstant(true);
        setLoop(wrap);
      }
      setIndex(target);
      setDrag(0);
      resetZoom();
    },
    [count, index, resetZoom]
  );

  // Saut de bouclage : on rétablit la transition à la frame suivante.
  useEffect(() => {
    if (!instant) return;
    const id = window.requestAnimationFrame(() => setInstant(false));
    return () => window.cancelAnimationFrame(id);
  }, [instant]);

  // Badge de bouclage : disparaît tout seul.
  useEffect(() => {
    if (!loop) return;
    const id = window.setTimeout(() => setLoop(null), 1100);
    return () => window.clearTimeout(id);
  }, [loop]);

  // Portail : on attend le montage client.
  useEffect(() => setMounted(true), []);

  // Ouverture : index initial, focus, verrou du scroll body.
  useLayoutEffect(() => {
    if (!open) return;
    setIndex(clampIndex(initialIndex));
    setDrag(0);
    resetZoom();
    setLoop(null);
    setInstant(false);
    previouslyFocused.current = document.activeElement;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    // Focus dans la modale au tick suivant (après le rendu du portail).
    const id = window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => {
      body.style.overflow = prevOverflow;
      window.clearTimeout(id);
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, initialIndex, clampIndex, resetZoom]);

  // Légende : cross-fade à chaque changement d'image.
  useEffect(() => {
    if (!open) return;
    const next = images[index]?.caption ?? null;
    if (next === shownCaption) return;
    setCaptionVisible(false);
    const id = window.setTimeout(() => {
      setShownCaption(next);
      setCaptionVisible(true);
    }, 160);
    return () => window.clearTimeout(id);
  }, [index, open, images, shownCaption]);

  // Clavier : flèches, début/fin, échap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          go(index + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          go(index - 1);
          break;
        case "Home":
          e.preventDefault();
          go(0);
          break;
        case "End":
          e.preventDefault();
          go(count - 1);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, count, go, onClose]);

  const markLoaded = useCallback(
    (i: number) => setLoaded((prev) => (prev[i] ? prev : { ...prev, [i]: true })),
    []
  );

  // Scrubber centré : translate la bande pour garder l'active pile au centre
  // (calcul analytique → exact même aux extrémités, pendant que les tailles animent).
  useEffect(() => {
    if (!open) return;
    const recenter = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const activeCenter = index * (THUMB_W + THUMB_GAP) + THUMB_ACTIVE_W / 2;
      setTx(wrapper.clientWidth / 2 - activeCenter);
    };
    recenter();
    window.addEventListener("resize", recenter);
    return () => window.removeEventListener("resize", recenter);
  }, [index, open]);

  // Plein écran navigateur (bonus) — synchronisé avec l'API Fullscreen.
  useEffect(() => {
    if (!open) return;
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [open]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      dialogRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  // --- Gestes (pointer events) -------------------------------------------

  const onPointerDown = (e: React.PointerEvent) => {
    // Laisse les contrôles (boutons) gérer leurs propres clics.
    if ((e.target as HTMLElement).closest("[data-control]")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    g.moved = false;

    if (pointers.current.size === 2) {
      // Début d'un pinch : distance et zoom de référence.
      const [a, b] = [...pointers.current.values()];
      g.pinchDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      g.pinchZoom = zoom;
      setDragging(false);
    } else {
      g.startX = e.clientX;
      g.startY = e.clientY;
      g.startTime = performance.now();
      g.panStart = { ...pan };
      if (zoom === 1) setDragging(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;

    if (pointers.current.size === 2) {
      // Pinch zoom.
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const next = Math.max(1, Math.min(MAX_ZOOM, (g.pinchZoom * dist) / g.pinchDist));
      setZoom(next);
      if (next === 1) setPan({ x: 0, y: 0 });
      g.moved = true;
      return;
    }

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) g.moved = true;

    if (zoom > 1) {
      // Image zoomée : on déplace (pan) au lieu de changer de photo.
      const vp = viewportRef.current;
      const maxX = vp ? ((zoom - 1) * vp.clientWidth) / 2 : 0;
      const maxY = vp ? ((zoom - 1) * vp.clientHeight) / 2 : 0;
      setPan({
        x: Math.max(-maxX, Math.min(maxX, g.panStart.x + dx)),
        y: Math.max(-maxY, Math.min(maxY, g.panStart.y + dy)),
      });
      return;
    }

    // Swipe horizontal avec résistance aux extrémités.
    let offset = dx;
    if ((index === 0 && dx > 0) || (index === count - 1 && dx < 0)) {
      offset = dx * 0.35;
    }
    setDrag(offset);
  };

  const endPointer = (e: React.PointerEvent) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);

    if (pointers.current.size >= 1) {
      // Encore un doigt : on réamorce un éventuel pan/swipe.
      const remaining = [...pointers.current.entries()][0];
      g.startX = remaining[1].x;
      g.startY = remaining[1].y;
      g.startTime = performance.now();
      g.panStart = { ...pan };
      return;
    }

    if (zoom > 1) {
      setDragging(false);
      return;
    }

    // Tap (pas de déplacement) → double-tap pour zoomer.
    if (!g.moved) {
      const now = performance.now();
      if (now - g.lastTap < 300) {
        setZoom(2.5);
        g.lastTap = 0;
      } else {
        g.lastTap = now;
      }
      setDragging(false);
      setDrag(0);
      return;
    }

    // Décision swipe : seuil de distance OU vélocité.
    const vp = viewportRef.current;
    const width = vp?.clientWidth ?? 1;
    const dt = Math.max(1, performance.now() - g.startTime);
    const velocity = drag / dt; // px/ms
    const distThreshold = width * 0.18;

    setDragging(false);
    if (drag <= -distThreshold || velocity < -0.45) {
      go(index + 1);
    } else if (drag >= distThreshold || velocity > 0.45) {
      go(index - 1);
    } else {
      setDrag(0);
    }
  };

  // Piège à focus minimal (Tab cyclique dans la modale).
  const onDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open || !mounted || count === 0) return null;

  const trackTransform = `translateX(calc(${-index * 100}% + ${drag}px))`;
  const showArrows = count > 1;
  const showProgress = count > 1 && count <= 20;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={fr.property.gallery.ouvrir}
      tabIndex={-1}
      dir="ltr"
      onKeyDown={onDialogKeyDown}
      className="fixed inset-0 z-[1200] flex flex-col bg-ink/40 outline-none backdrop-blur-2xl select-none"
    >
      {/* Voile de lisibilité (haut) — léger, garde le fond perméable ailleurs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-ink/60 to-transparent" />

      {/* Barre supérieure : fermer · titre de l'annonce · compteur + plein écran */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-3 p-3 sm:p-4">
        <button
          type="button"
          data-control
          onClick={onClose}
          aria-label={fr.property.gallery.fermer}
          title={fr.property.gallery.fermer}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/40 text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-ink/60"
        >
          <CloseIcon width={20} height={20} />
        </button>

        {title ? (
          <h2 className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-white drop-shadow-md sm:text-base">
            {title}
          </h2>
        ) : (
          <span className="flex-1" />
        )}

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-ink/40 px-3 py-1.5 text-sm font-semibold text-white tabular-nums ring-1 ring-white/15 backdrop-blur-md">
            {fr.property.gallery.compteur(index + 1, count)}
          </span>
          <button
            type="button"
            data-control
            onClick={toggleFullscreen}
            aria-label={
              isFullscreen
                ? fr.property.gallery.quitterPleinEcran
                : fr.property.gallery.pleinEcran
            }
            title={
              isFullscreen
                ? fr.property.gallery.quitterPleinEcran
                : fr.property.gallery.pleinEcran
            }
            className="hidden h-10 w-10 items-center justify-center rounded-full bg-ink/40 text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-ink/60 sm:flex"
          >
            <FullscreenIcon exit={isFullscreen} />
          </button>
        </div>
      </div>

      {/* Surface de swipe */}
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        className="relative flex-1 overflow-hidden"
        style={{ touchAction: "none", cursor: zoom > 1 ? "grab" : "default" }}
      >
        <div
          className="flex h-full"
          style={{
            transform: trackTransform,
            transition: dragging || instant ? "none" : TRANSITION,
            willChange: "transform",
          }}
        >
          {images.map((img, i) => {
            const inWindow = Math.abs(i - index) <= 1;
            const isActive = i === index;
            const innerTransform = isActive
              ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
              : "scale(0.92)";
            return (
              <div
                key={i}
                className="relative flex h-full w-full flex-none items-center justify-center"
              >
                <div
                  className="relative h-full w-full"
                  style={{
                    transform: innerTransform,
                    transition: dragging || instant ? "none" : `transform 0.3s ${EASE}`,
                    willChange: "transform",
                  }}
                >
                  {inWindow ? (
                    <>
                      {!loaded[i] ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            aria-label={fr.property.gallery.chargement}
                            className="h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white/90"
                          />
                        </div>
                      ) : null}
                      <Image
                        src={img.url}
                        alt={img.alt}
                        fill
                        draggable={false}
                        sizes="100vw"
                        priority={isActive}
                        onLoad={() => markLoaded(i)}
                        className="object-contain"
                        style={{
                          opacity: loaded[i] ? 1 : 0,
                          transition: "opacity 0.25s ease",
                        }}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Voile bas — lisibilité légende + progression, sans alourdir le fond */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-40 bg-gradient-to-t from-ink/55 to-transparent" />

        {/* Flèches translucides foncées (desktop) */}
        {showArrows ? (
          <>
            <button
              type="button"
              data-control
              onClick={() => go(index - 1)}
              aria-label={fr.property.gallery.precedente}
              className="group absolute inset-y-0 left-0 z-10 hidden w-[16%] max-w-32 items-center justify-start ps-4 sm:flex"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/40 text-white ring-1 ring-white/15 backdrop-blur-md transition group-hover:scale-110 group-hover:bg-ink/60">
                <Chevron dir="left" />
              </span>
            </button>
            <button
              type="button"
              data-control
              onClick={() => go(index + 1)}
              aria-label={fr.property.gallery.suivante}
              className="group absolute inset-y-0 right-0 z-10 hidden w-[16%] max-w-32 items-center justify-end pe-4 sm:flex"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/40 text-white ring-1 ring-white/15 backdrop-blur-md transition group-hover:scale-110 group-hover:bg-ink/60">
                <Chevron dir="right" />
              </span>
            </button>
          </>
        ) : null}

      </div>

      {/* Bas : légende + progression (barre segmentée mobile · vignettes desktop) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        {/* Légende contextuelle — carte flottante en bas à gauche, en fondu */}
        {shownCaption ? (
          <div className="px-4 pb-3 sm:px-6">
            <div
              className="inline-block max-w-[80%] rounded-2xl bg-ink/45 px-4 py-3 ring-1 ring-white/10 backdrop-blur-md sm:max-w-md"
              style={{
                opacity: captionVisible ? 1 : 0,
                transform: captionVisible ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
              }}
            >
              <p
                dir="auto"
                className="text-base font-semibold leading-snug text-white drop-shadow sm:text-lg"
              >
                {shownCaption}
              </p>
            </div>
          </div>
        ) : null}

        {/* Barre segmentée façon Stories — mobile */}
        {showProgress ? (
          <div className="flex justify-center px-6 pb-5 sm:hidden">
            <div className="pointer-events-auto flex w-full max-w-md items-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  data-control
                  onClick={() => go(i)}
                  aria-label={fr.property.gallery.allerA(i + 1)}
                  aria-current={i === index}
                  className="group flex-1 py-2"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      i === index
                        ? "bg-white"
                        : i < index
                          ? "bg-white/55"
                          : "bg-white/25"
                    } group-hover:bg-white/80`}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Scrubber de vignettes centré — desktop */}
        {count > 1 ? (
          <div className="hidden px-4 pb-4 sm:block">
            <div ref={wrapperRef} className="overflow-hidden">
              <div
                className="pointer-events-auto flex w-max items-center py-1"
                style={{
                  gap: THUMB_GAP,
                  transform: `translateX(${tx}px)`,
                  transition: instant ? "none" : `transform 0.3s ${EASE}`,
                  willChange: "transform",
                }}
              >
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    data-control
                    data-idx={i}
                    onClick={() => go(i)}
                    aria-label={fr.property.gallery.allerA(i + 1)}
                    aria-current={i === index}
                    className={`relative flex-none overflow-hidden rounded-lg transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      i === index
                        ? "h-[72px] w-24 opacity-100"
                        : "h-12 w-16 opacity-50 hover:opacity-90"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      draggable={false}
                      sizes="96px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Flourish de bouclage : badge central animé « retour au début » */}
      {loop ? (
        <div
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-ink/25"
          style={{ animation: "darna-loop-veil 1.1s ease forwards" }}
        >
          <div
            className="flex items-center gap-2.5 rounded-full bg-ink/65 px-5 py-3 text-white ring-1 ring-white/15 backdrop-blur-md"
            style={{ animation: "darna-loop-pop 1.1s ease forwards" }}
          >
            <span className="flex" style={{ animation: "darna-loop-spin 0.7s ease" }}>
              <LoopIcon flip={loop === "end"} />
            </span>
            <span className="text-sm font-semibold">
              {loop === "start"
                ? fr.property.gallery.boucleDebut
                : fr.property.gallery.boucleFin}
            </span>
          </div>
        </div>
      ) : null}
    </div>,
    document.body
  );
}

function LoopIcon({ flip }: { flip?: boolean }) {
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
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 4v5h-5" />
    </svg>
  );
}

function FullscreenIcon({ exit }: { exit: boolean }) {
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
      {exit ? (
        <>
          <path d="M9 4H5a1 1 0 0 0-1 1v4" />
          <path d="M15 4h4a1 1 0 0 1 1 1v4" />
          <path d="M9 20H5a1 1 0 0 1-1-1v-4" />
          <path d="M15 20h4a1 1 0 0 0 1-1v-4" />
        </>
      ) : (
        <>
          <path d="M4 9V5a1 1 0 0 1 1-1h4" />
          <path d="M20 9V5a1 1 0 0 0-1-1h-4" />
          <path d="M4 15v4a1 1 0 0 0 1 1h4" />
          <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
        </>
      )}
    </svg>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ transform: dir === "left" ? "rotate(0deg)" : "rotate(180deg)" }}
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
