import { StarIcon } from "@/components/icons";

/** Affichage lecture seule d'un avis (hôte→voyageur ou inversement) déjà publié. */
export function GuestReviewDisplay({
  rating,
  comment,
  label,
  className = "",
}: {
  rating: number;
  comment: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-cream p-3 text-xs ring-1 ring-darna/10 ${className}`}>
      <p className="flex items-center gap-1 font-semibold text-body/70">
        {label}
        <span className="ms-1 flex items-center gap-0.5 text-sand">
          {[1, 2, 3, 4, 5].map((n) => (
            <StarIcon key={n} width={12} height={12} fill={n <= rating ? "currentColor" : "none"} />
          ))}
        </span>
      </p>
      <p className="mt-1 text-body/70">{comment}</p>
    </div>
  );
}
