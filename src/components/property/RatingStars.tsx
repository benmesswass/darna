import { StarIcon } from "@/components/icons";

/**
 * 5 étoiles toujours affichées (vides par défaut), remplies proportionnellement
 * à la note (ex. 3.5/5 → 3 étoiles pleines + 1 à moitié + 1 vide) via une
 * superposition clippée en largeur — plus lisible qu'une seule étoile + chiffre.
 */
export function RatingStars({
  rating,
  size = 16,
  className = "",
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const fillPct = Math.max(0, Math.min(100, (rating / 5) * 100));

  return (
    <span className={`relative inline-flex ${className}`} aria-hidden>
      <span className="flex gap-1 text-sand/25">
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon key={i} width={size} height={size} fill="currentColor" stroke="none" />
        ))}
      </span>
      <span
        className="absolute inset-0 flex gap-1 overflow-hidden text-sand"
        style={{ width: `${fillPct}%` }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon key={i} width={size} height={size} fill="currentColor" stroke="none" />
        ))}
      </span>
    </span>
  );
}
