import { getT } from "@/lib/i18n/server";
import { ShieldIcon } from "@/components/icons";
import { ReviewForm } from "./ReviewForm";
import { ReviewsList } from "./ReviewsList";

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
};

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
    <section id="avis" className="scroll-mt-24">
      <h2 className="text-xl font-bold text-darna">{fr.property.avis}</h2>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink/60">
        <ShieldIcon width={14} height={14} className="text-darna" />
        {fr.property.avisGarantie}
      </p>

      {eligibleBookingId ? <ReviewForm bookingId={eligibleBookingId} /> : null}

      <ReviewsList reviews={reviews} />
    </section>
  );
}
