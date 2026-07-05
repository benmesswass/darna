import { StarIcon } from "@/components/icons";

/**
 * Toujours 5 étoiles à des positions fixes ; chacune se remplit
 * individuellement selon la note (ex. 3.5/5 → 3 pleines + la 4e à moitié
 * remplie sur elle-même + la 5e vide), plutôt qu'un clip sur la rangée
 * entière — qui désynchronisait le calque rempli des espacements entre
 * étoiles.
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
  return (
    <span className={`inline-flex gap-1 ${className}`} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => {
        const fillPct = Math.max(0, Math.min(100, (rating - i) * 100));
        return (
          <span
            key={i}
            className="relative inline-block shrink-0"
            style={{ width: size, height: size }}
          >
            <StarIcon
              width={size}
              height={size}
              fill="currentColor"
              stroke="none"
              className="absolute inset-0 text-sand/25"
            />
            {fillPct > 0 ? (
              <span
                className="absolute inset-y-0 start-0 overflow-hidden"
                style={{ width: `${fillPct}%` }}
              >
                <StarIcon width={size} height={size} fill="currentColor" stroke="none" className="text-sand" />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
