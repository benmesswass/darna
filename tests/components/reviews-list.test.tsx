/**
 * AHC7 (ANNULATION_HOTE_CORRECTIFS_ROADMAP.md) — signal réputationnel
 * « annulé par l'hôte » (décisions produit du 2026-07-08 puis affinées) :
 * affiché comme un avis (note automatique de 1/5, style carte d'avis) mais
 * jamais attribué à un voyageur (« auteur » = Darna), avec les dates EXACTES
 * du séjour annulé. Compte RÉELLEMENT dans la moyenne/l'histogramme affichés
 * (dissuasif réel, pas cosmétique) mais jamais dans les sous-notes (propreté,
 * communication…), qui n'ont pas de sens pour une annulation.
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
  checkIn: "2026-05-20T00:00:00.000Z",
  checkOut: "2026-05-23T00:00:00.000Z",
};

describe("ReviewsList — entrée système « annulé par l'hôte » (§AHC7)", () => {
  it("apparaît dans le flux, attribuée à « Darna » (pas un voyageur), avec les dates EXACTES du séjour", () => {
    renderWithProviders(
      <ReviewsList reviews={[review()]} cancellations={[cancellation]} />
    );
    expect(screen.getByText("Darna")).toBeInTheDocument();
    expect(screen.getByText("Note automatique")).toBeInTheDocument();
    // Dates exactes (jour précis), pas seulement le mois.
    expect(screen.getByText(/20 mai 2026/)).toBeInTheDocument();
    expect(screen.getByText(/23 mai 2026/)).toBeInTheDocument();
  });

  it("compte RÉELLEMENT dans la moyenne et le total affichés (1/5 pèse dans le score)", () => {
    renderWithProviders(
      <ReviewsList
        reviews={[review({ id: "r1", rating: 5 }), review({ id: "r2", rating: 5 })]}
        cancellations={[cancellation]}
      />
    );
    // (5 + 5 + 1) / 3 = 3.666… → 3.7
    expect(screen.getByText("3.7")).toBeInTheDocument();
    // Total = 2 vrais avis + 1 entrée système = 3.
    expect(screen.getByText("3 avis")).toBeInTheDocument();
  });

  it("apparaît sous le filtre « 1 étoile » (elle compte comme une note de 1/5)", () => {
    renderWithProviders(
      <ReviewsList reviews={[review({ rating: 5 })]} cancellations={[cancellation]} />
    );
    const filterBtn = screen.getByRole("button", { name: /1 étoile/i });
    fireEvent.click(filterBtn);

    expect(screen.getByText("Darna")).toBeInTheDocument();
    // Le vrai avis 5 étoiles ne matche plus le filtre 1 étoile.
    expect(screen.queryByText("Excellent séjour")).not.toBeInTheDocument();
  });

  it("ne fausse jamais les sous-notes (propreté, communication…) — calculées sur les vrais avis uniquement", () => {
    renderWithProviders(
      <ReviewsList
        reviews={[review({ proprete: 4, communication: 4, conformite: 4, qualitePrix: 4 })]}
        cancellations={[cancellation]}
      />
    );
    // Sous-note propreté = 4.0 (moyenne du seul vrai avis, pas diluée par
    // l'entrée système qui n'a pas de sous-notes). `{ selector: "p" }` cible
    // le récap (un <p> dédié) et exclut la ligne inline de la carte d'avis
    // ("Propreté 4/5" dans un <span>, où seul le texte AVANT le <b> compte
    // pour le matcher texte par défaut de testing-library).
    const proprete = screen.getByText("Propreté", { selector: "p" }).nextElementSibling;
    expect(proprete).toHaveTextContent("4.0");
  });

  it("le vrai avis reste affiché normalement même avec une entrée système présente", () => {
    renderWithProviders(
      <ReviewsList reviews={[review({ comment: "Séjour parfait" })]} cancellations={[cancellation]} />
    );
    expect(screen.getByText("Séjour parfait")).toBeInTheDocument();
  });

  it("sans aucun vrai avis mais avec une annulation : affiche l'entrée système (1.0/5 · 1 avis), pas le message « aucun avis »", () => {
    renderWithProviders(<ReviewsList reviews={[]} cancellations={[cancellation]} />);
    expect(screen.getByText("Darna")).toBeInTheDocument();
    expect(screen.getByText("1.0")).toBeInTheDocument();
    expect(screen.getByText("1 avis")).toBeInTheDocument();
    expect(screen.queryByText(/soyez le premier/i)).not.toBeInTheDocument();
  });

  it("sans avis ni annulation : affiche le message « aucun avis » (comportement inchangé)", () => {
    renderWithProviders(<ReviewsList reviews={[]} cancellations={[]} />);
    expect(screen.getByText(/soyez le premier/i)).toBeInTheDocument();
  });
});

// P2.3 (ROADMAP.md, XSS stocké) — un commentaire d'avis stocké tel quel en
// base (aucun sanitize-html côté écriture, cf. src/actions/bookings.ts) ne
// doit jamais s'exécuter à l'affichage : React échappe {item.review.comment}
// par défaut (interpolation texte, jamais dangerouslySetInnerHTML).
describe("ReviewsList — contenu utilisateur toujours affiché en texte inerte (P2.3)", () => {
  it("un commentaire contenant une balise <script> ne crée aucun élément <script>", () => {
    const payload = '<script>window.__xss__="pwned"</script>';
    renderWithProviders(
      <ReviewsList reviews={[review({ comment: payload })]} cancellations={[]} />
    );

    expect(document.querySelector("script[src], script:not([type])")).toBeNull();
    // Le payload apparaît tel quel, comme TEXTE — preuve que React l'a échappé
    // plutôt que de l'interpréter comme du balisage.
    expect(screen.getByText(payload)).toBeInTheDocument();
  });

  it("un nom d'auteur contenant du balisage reste du texte inerte", () => {
    const payload = '<img src=x onerror=alert(1)>';
    renderWithProviders(
      <ReviewsList reviews={[review({ authorName: payload })]} cancellations={[]} />
    );

    expect(document.querySelector("img[src='x']")).toBeNull();
    expect(screen.getByText(payload)).toBeInTheDocument();
  });
});
