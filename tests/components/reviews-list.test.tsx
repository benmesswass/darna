/**
 * AHC7 (ANNULATION_HOTE_CORRECTIFS_ROADMAP.md) — signal réputationnel
 * « annulé par l'hôte » mélangé au flux d'avis.
 *
 * Prouve : l'entrée système apparaît dans le flux chronologique (tri
 * recent/old), n'apparaît PAS sous un filtre par note ni un tri par note
 * (elle n'a pas de note), et ne fausse jamais la moyenne/l'histogramme/les
 * sous-notes affichés (calculés uniquement sur les vrais avis).
 */
import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { ReviewsList } from "@/components/property/ReviewsList";
import type { ReviewItem, HostCancellationEntry } from "@/components/property/ReviewsSection";
import { renderWithProviders } from "./helpers";

function review(overrides: Partial<ReviewItem> = {}): ReviewItem {
  return {
    id: "rev-1",
    rating: 5,
    proprete: 5,
    communication: 5,
    conformite: 5,
    qualitePrix: 5,
    comment: "Excellent séjour",
    authorName: "Wassim",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

const cancellation: HostCancellationEntry = {
  id: "bk-cancelled",
  cancelledAt: "2026-05-15T00:00:00.000Z",
};

describe("ReviewsList — entrée système « annulé par l'hôte » (§AHC7)", () => {
  it("apparaît dans le flux chronologique (tri par défaut)", () => {
    renderWithProviders(
      <ReviewsList reviews={[review()]} cancellations={[cancellation]} />
    );
    expect(screen.getByText(/annulée par l'hôte/i)).toBeInTheDocument();
  });

  it("n'est jamais comptée dans la moyenne / l'histogramme / les sous-notes", () => {
    renderWithProviders(
      <ReviewsList
        reviews={[review({ id: "r1", rating: 4 }), review({ id: "r2", rating: 4 })]}
        cancellations={[cancellation, { ...cancellation, id: "bk-2" }]}
      />
    );
    // Moyenne = 4.0 (moyenne des 2 vrais avis), pas influencée par les 2
    // entrées système.
    expect(screen.getByText("4.0")).toBeInTheDocument();
    // "2 avis" — le compteur ne compte QUE les vrais avis.
    expect(screen.getByText("2 avis")).toBeInTheDocument();
  });

  it("disparaît sous un filtre par note (elle n'a pas de note)", () => {
    renderWithProviders(
      <ReviewsList
        reviews={[review({ rating: 5 })]}
        cancellations={[cancellation]}
      />
    );
    // Clique le filtre "5 étoiles" dans l'histogramme.
    const filterBtn = screen.getByRole("button", { name: /5 étoile/i });
    fireEvent.click(filterBtn);

    expect(screen.queryByText(/annulée par l'hôte/i)).not.toBeInTheDocument();
  });

  it("le vrai avis reste affiché normalement même avec une entrée système présente", () => {
    renderWithProviders(
      <ReviewsList reviews={[review({ comment: "Séjour parfait" })]} cancellations={[cancellation]} />
    );
    expect(screen.getByText("Séjour parfait")).toBeInTheDocument();
  });

  it("sans aucun vrai avis mais avec une annulation : affiche l'entrée système, pas le message « aucun avis »", () => {
    renderWithProviders(<ReviewsList reviews={[]} cancellations={[cancellation]} />);
    expect(screen.getByText(/annulée par l'hôte/i)).toBeInTheDocument();
    expect(screen.queryByText(/soyez le premier/i)).not.toBeInTheDocument();
  });

  it("sans avis ni annulation : affiche le message « aucun avis » (comportement inchangé)", () => {
    renderWithProviders(<ReviewsList reviews={[]} cancellations={[]} />);
    expect(screen.getByText(/soyez le premier/i)).toBeInTheDocument();
  });
});
