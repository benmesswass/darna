/**
 * Phase 2 — Composant `Price` + formatage devise (diaspora EUR).
 * Vérifie l'affichage TND par défaut, la conversion EUR quand le mode diaspora
 * est actif (persisté en localStorage), et les fonctions de formatage pures.
 */
import { describe, expect, it, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { Price, formatTnd, formatEur } from "@/components/currency/Price";
import { renderWithProviders } from "./helpers";

describe("formatTnd / formatEur", () => {
  it("formate un montant TND avec séparateur de milliers", () => {
    expect(formatTnd(1200)).toMatch(/1[\s ]?200 TND/);
  });

  it("convertit et arrondit en EUR avec le préfixe ≈", () => {
    const label = formatEur(1000);
    expect(label.startsWith("≈")).toBe(true);
    expect(label.endsWith("€")).toBe(true);
  });
});

describe("<Price />", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("affiche le montant en TND par défaut", () => {
    renderWithProviders(<Price amount={250} />);
    expect(screen.getByText(/250 TND/)).toBeInTheDocument();
  });

  it("affiche le suffixe quand il est fourni", () => {
    renderWithProviders(<Price amount={250} suffix="/ nuit" />);
    expect(screen.getByText("/ nuit")).toBeInTheDocument();
  });

  it("bascule en EUR quand le mode diaspora est persisté", async () => {
    window.localStorage.setItem("darna-currency", "EUR");
    renderWithProviders(<Price amount={1000} />);
    // Le provider lit localStorage dans un effet → l'affichage EUR apparaît après montage.
    expect(await screen.findByText(/€/)).toBeInTheDocument();
  });
});
