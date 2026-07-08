/**
 * Phase 2 — `PropertyCard` (vignette annonce, parcours recherche J9).
 *
 * Server Component async : on résout la promesse avant `render()` (RTL ne
 * gère pas le mode async lui-même), en mockant ses dépendances serveur
 * (`getT`, `@/actions/properties` — tirée transitivement par `FavoriteButton`
 * même non rendu, via son import statique).
 *
 * Couvre : prix + suffixe « / nuit », total séjour tout compris (cohérent
 * avec « le prix affiché est le prix payé »), badge Vérifié, ville/gouvernorat.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ListingWithPhoto } from "@/lib/listings";

vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { parNuit: "/ nuit", parMois: "/ mois" },
    property: {
      surface: (n: number) => `${n} m²`,
      pieces: (n: number) => `${n} pièces`,
      capacite: (n: number) => `${n} voyageurs max`,
    },
    search: { totalSejour: (n: number) => `pour ${n} nuits, tout compris` },
    badges: {
      verifie: "Vérifié",
      verifieTooltip: "Annonce vérifiée par un Wakil.",
      alaUne: "À la une",
      alaUneTooltip: "Mise en avant.",
      nouveau: "Nouveau",
    },
  }),
}));
vi.mock("@/actions/properties", () => ({
  addFavoriteAction: vi.fn(),
  createFolderWithFavoriteAction: vi.fn(),
  removeFavoriteAction: vi.fn(),
}));
// Les badges sont eux-mêmes des Server Components async (comme PropertyCard) :
// React ne peut pas les rendre en JSX imbriqué sous un rendu client classique
// (RTL) sans streaming RSC. On les remplace par des équivalents synchrones —
// leur propre rendu est hors du périmètre de ce test (composition PropertyCard).
vi.mock("@/components/property/Badges", () => ({
  FeaturedBadge: () => <span>À la une</span>,
  VerifiedBadge: () => <span>Vérifié</span>,
  FreshnessBadge: () => null,
  TypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
}));

const { PropertyCard } = await import("@/components/property/PropertyCard");

function baseProperty(overrides: Partial<ListingWithPhoto> = {}): ListingWithPhoto {
  return {
    id: "prop-1",
    slug: "appartement-hammamet-test",
    title: "Appartement vue mer à Hammamet",
    description: "Un bel appartement.",
    type: "SEJOUR",
    vertical: "STAY",
    status: "ACTIVE",
    verified: false,
    verificationLevel: null,
    verifiedAt: null,
    verifiedById: null,
    price: 200,
    ratingAvg: null,
    ratingCount: 0,
    surface: null,
    rooms: null,
    maxGuests: null,
    city: "Hammamet",
    gouvernorat: "Nabeul",
    address: null,
    latitude: 36.4,
    longitude: 10.61,
    amenities: "",
    publishedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    featuredUntil: null,
    cancelPolicy: "MODEREE",
    cashPaymentEnabled: false,
    cashTermsAcceptedAt: null,
    cancelBlockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerId: "owner-1",
    photos: [],
    stay: { maxGuests: 4 },
    reviews: [],
    ...overrides,
  } as ListingWithPhoto;
}

describe("<PropertyCard />", () => {
  it("affiche le prix au format TND avec le suffixe « / nuit » pour un séjour", async () => {
    render(await PropertyCard({ property: baseProperty({ price: 250 }) }));
    expect(screen.getByText(/250 TND/)).toBeInTheDocument();
    expect(screen.getByText("/ nuit")).toBeInTheDocument();
  });

  it("affiche le suffixe « / mois » pour une location", async () => {
    render(
      await PropertyCard({
        property: baseProperty({ type: "LOCATION", price: 1500, stay: null }),
      })
    );
    expect(screen.getByText("/ mois")).toBeInTheDocument();
  });

  it("affiche le total séjour tout compris quand `nights` est fourni (cohérence prix affiché = prix payé)", async () => {
    // subtotal = 200*3 = 600 ; frais de service ajoutés par le composant lui-même.
    render(await PropertyCard({ property: baseProperty({ price: 200 }), nights: 3 }));
    expect(screen.getByText(/pour 3 nuits, tout compris/)).toBeInTheDocument();
  });

  it("n'affiche pas le total séjour sans `nights`", async () => {
    render(await PropertyCard({ property: baseProperty() }));
    expect(screen.queryByText(/tout compris/)).not.toBeInTheDocument();
  });

  it("affiche le badge Vérifié quand l'annonce est vérifiée", async () => {
    render(await PropertyCard({ property: baseProperty({ verified: true }) }));
    expect(screen.getByText("Vérifié")).toBeInTheDocument();
  });

  it("affiche la ville et le gouvernorat", async () => {
    render(await PropertyCard({ property: baseProperty() }));
    expect(screen.getByText("Hammamet, Nabeul")).toBeInTheDocument();
  });

  it("pointe vers la page annonce avec la query string transmise", async () => {
    const { container } = render(
      await PropertyCard({
        property: baseProperty({ slug: "villa-sousse" }),
        query: "?arrivee=2026-08-01&depart=2026-08-05",
      })
    );
    const link = container.querySelector("a");
    expect(link).toHaveAttribute(
      "href",
      "/annonce/villa-sousse?arrivee=2026-08-01&depart=2026-08-05"
    );
  });
});
