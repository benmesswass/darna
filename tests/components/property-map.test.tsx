/**
 * Phase 2 (reliquat P1) — `PropertyMap` (wrapper carte).
 *
 * `MapInner` (Leaflet réel, react-leaflet) est mocké : Leaflet a besoin
 * d'APIs géométriques réelles du navigateur (ResizeObserver, layout) que
 * jsdom n'implémente pas fidèlement — même patron que les Server Components
 * async mockés dans `property-card.test.tsx`. On teste le COMPORTEMENT du
 * wrapper (bouton d'agrandissement, modale, filtres carte), pas les
 * internes de Leaflet lui-même (bibliothèque tierce).
 */
import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fr } from "@/lib/i18n/fr";
import type { MapMarker } from "@/components/map/types";
import { renderWithProviders } from "./helpers";

vi.mock("@/components/map/MapInner", () => ({
  default: ({ markers }: { markers: MapMarker[] }) => (
    <div data-testid="map-inner">{markers.length} marqueur(s)</div>
  ),
}));

const { PropertyMap } = await import("@/components/map/PropertyMap");

function marker(overrides: Partial<MapMarker> = {}): MapMarker {
  return {
    id: "p1",
    slug: "villa-hammamet",
    title: "Villa Hammamet",
    priceLabel: "380 TND / nuit",
    price: 380,
    verified: true,
    latitude: 36.4,
    longitude: 10.6,
    imageUrl: null,
    rating: 4.5,
    reviewCount: 12,
    city: "Hammamet",
    ...overrides,
  };
}

describe("<PropertyMap />", () => {
  it("rend la carte inline (MapInner monté d'emblée) avec le bouton d'agrandissement", async () => {
    renderWithProviders(<PropertyMap markers={[marker()]} />);
    // next/dynamic reste asynchrone même mocké : le composant chargé
    // n'apparaît qu'après résolution de la promesse d'import.
    expect(await screen.findByTestId("map-inner")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: fr.search.agrandirCarte })
    ).toBeInTheDocument();
  });

  it("ouvre la modale plein cadre au clic sur « Agrandir la carte »", async () => {
    renderWithProviders(<PropertyMap markers={[marker(), marker({ id: "p2" })]} />);

    await userEvent.click(screen.getByRole("button", { name: fr.search.agrandirCarte }));

    const dialog = await screen.findByRole("dialog", { name: fr.search.agrandirCarte });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(fr.search.resultats(2))).toBeInTheDocument();
  });

  it("le filtre prix (dans la modale) réduit le nombre de résultats affichés", async () => {
    renderWithProviders(
      <PropertyMap
        markers={[marker({ id: "p1", price: 100 }), marker({ id: "p2", price: 500 })]}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: fr.search.agrandirCarte }));
    const dialog = await screen.findByRole("dialog", { name: fr.search.agrandirCarte });

    // Panneau de filtres visible directement en desktop (md:flex) dans jsdom.
    const priceMinInput = within(dialog).getByPlaceholderText(fr.search.prixMin);
    await userEvent.type(priceMinInput, "200");

    expect(within(dialog).getByText(fr.search.resultats(1))).toBeInTheDocument();
  });

  it("ferme la modale au clic sur « Fermer la carte »", async () => {
    renderWithProviders(<PropertyMap markers={[marker()]} />);
    await userEvent.click(screen.getByRole("button", { name: fr.search.agrandirCarte }));
    await screen.findByRole("dialog", { name: fr.search.agrandirCarte });

    await userEvent.click(screen.getByRole("button", { name: fr.search.fermerCarte }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
