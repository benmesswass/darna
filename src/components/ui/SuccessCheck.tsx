/**
 * Check animé (cercle qui « pop » + trait qui se dessine) — D5 de
 * DESIGN_ROADMAP.md. Réservé aux 3 moments de célébration produit :
 * réservation confirmée, annonce publiée, avis publié. Même tracé que
 * `CheckIcon` (`src/components/icons.tsx`), viewBox 24x24.
 *
 * CSS pur (ROADMAP.md §P4.1, remplace `motion`) : `pathLength={1}` normalise
 * la longueur du tracé SVG à 1 quelle que soit sa géométrie réelle, ce qui
 * rend `stroke-dasharray/dashoffset` universel sans calculer la longueur du
 * chemin — `.darna-draw-check` (globals.css) anime juste 1 → 0.
 */
export function SuccessCheck({ size = 64 }: { size?: number }) {
  return (
    <span
      className="darna-pop-in inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="m5 13 4 4L19 7"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="darna-draw-check"
        />
      </svg>
    </span>
  );
}
