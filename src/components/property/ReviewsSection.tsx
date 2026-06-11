import { getT } from "@/lib/i18n/server";
import { ShieldIcon, StarIcon } from "@/components/icons";
import { ReviewForm } from "./ReviewForm";

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-sand" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          width={14}
          height={14}
          fill={n <= rating ? "currentColor" : "none"}
          className={n <= rating ? "" : "text-ink/20"}
        />
      ))}
    </span>
  );
}

export async function ReviewsSection({
  reviews,
  eligibleBookingId,
}: {
  propertyId: string;
  propertyType: string;
  reviews: ReviewItem[];
  /** Réservation terminée du visiteur, sans avis — ouvre le formulaire. */
  eligibleBookingId?: string | null;
}) {
  const fr = await getT();
  return (
    <section id="avis">
      <h2 className="text-xl font-bold text-darna">{fr.property.avis}</h2>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink/60">
        <ShieldIcon width={14} height={14} className="text-darna" />
        {fr.property.avisGarantie}
      </p>

      {eligibleBookingId ? <ReviewForm bookingId={eligibleBookingId} /> : null}

      {reviews.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-white p-5 text-sm text-ink/60 ring-1 ring-darna/10">
          {fr.property.aucunAvis}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl bg-white p-5 ring-1 ring-darna/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-darna text-sm font-bold text-white">
                    {review.authorName.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {review.authorName}
                    </p>
                    <p className="text-xs text-ink/50">
                      {new Intl.DateTimeFormat("fr-FR", {
                        month: "long",
                        year: "numeric",
                      }).format(new Date(review.createdAt))}
                      {" · "}
                      <span className="font-medium text-darna">
                        {fr.property.avisVerifie}
                      </span>
                    </p>
                  </div>
                </div>
                <Stars rating={review.rating} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/80">
                {review.comment}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
