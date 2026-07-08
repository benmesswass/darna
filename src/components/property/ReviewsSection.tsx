import { getT } from "@/lib/i18n/server";
import { ShieldIcon } from "@/components/icons";
import { ReviewForm } from "./ReviewForm";
import { ReviewsList } from "./ReviewsList";

export type ReviewItem = {
  id: string;
  rating: number;
  // Sous-notes (F2) : propreté, communication, conformité à l'annonce,
  // rapport qualité/prix — chacune 1 à 5.
  proprete: number;
  communication: number;
  conformite: number;
  qualitePrix: number;
  comment: string;
  authorName: string;
  createdAt: string;
  // Annonce concernée — utile seulement dans un contexte multi-annonces
  // (fiche hôte, qui agrège les avis de toutes les annonces de l'hôte).
  property?: { title: string; slug: string };
};

/**
 * Entrée SYSTÈME « annulé par l'hôte » (§AHC7) — jamais un avis noté : pas de
 * rating/sous-notes/auteur, jamais comptée dans la moyenne/histogramme. Sert
 * uniquement à interrompre le flux chronologique des avis avec un signal
 * dissuasif discret.
 */
export type HostCancellationEntry = { id: string; cancelledAt: string };

export async function ReviewsSection({
  reviews,
  cancellations = [],
  eligibleBookingId,
}: {
  propertyId: string;
  propertyType: string;
  reviews: ReviewItem[];
  cancellations?: HostCancellationEntry[];
  /** Réservation terminée du visiteur, sans avis — ouvre le formulaire. */
  eligibleBookingId?: string | null;
}) {
  const fr = await getT();
  return (
    <section id="avis" className="scroll-mt-24">
      <h2 className="text-xl font-bold text-heading">{fr.property.avis}</h2>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-body/60">
        <ShieldIcon width={14} height={14} className="text-heading" />
        {fr.property.avisGarantie}
      </p>

      {eligibleBookingId ? <ReviewForm bookingId={eligibleBookingId} /> : null}

      <ReviewsList reviews={reviews} cancellations={cancellations} />
    </section>
  );
}
