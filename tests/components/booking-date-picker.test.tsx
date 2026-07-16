/**
 * Phase 2 (reliquat P1) — `BookingDatePicker` (sélecteur de dates de
 * réservation, `/annonce/[slug]/reserver`).
 *
 * Composant CONTRÔLÉ, pur (aucun réseau) : on pilote `checkIn`/`checkOut`
 * depuis le test comme le ferait `BookingPanel`. Horloge figée (15 juillet
 * 2026) pour des libellés de jour déterministes. `fireEvent.click` plutôt que
 * `userEvent` : userEvent + fake timers se bloquent l'un l'autre (delais
 * internes basés sur setTimeout) — pas besoin de la simulation clavier/pointeur
 * complète de userEvent ici, un simple clic suffit.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { fr } from "@/lib/i18n/fr";
import { BookingDatePicker } from "@/components/booking/BookingDatePicker";
import { renderWithProviders } from "./helpers";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 15)); // 15 juillet 2026 (local)
});
afterEach(() => {
  vi.useRealTimers();
});

describe("<BookingDatePicker />", () => {
  it("clic sur un jour futur libre → sélectionne l'arrivée (checkIn, null)", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <BookingDatePicker
        unavailable={[]}
        checkIn={null}
        checkOut={null}
        onChange={onChange}
        monthsToShow={1}
      />
    );

    fireEvent.click(screen.getByText("20"));

    expect(onChange).toHaveBeenCalledWith("2026-07-20", null);
  });

  it("2e clic après une arrivée choisie → complète la plage (checkIn, checkOut) et affiche « X nuits »", () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(
      <BookingDatePicker
        unavailable={[]}
        checkIn="2026-07-20"
        checkOut={null}
        onChange={onChange}
        monthsToShow={1}
      />
    );

    fireEvent.click(screen.getByText("23"));
    expect(onChange).toHaveBeenCalledWith("2026-07-20", "2026-07-23");

    rerender(
      <BookingDatePicker
        unavailable={[]}
        checkIn="2026-07-20"
        checkOut="2026-07-23"
        onChange={onChange}
        monthsToShow={1}
      />
    );
    // Le libellé "X nuits" apparaît deux fois (en-tête + badge flottant sur la
    // date de fin) : on vérifie juste sa présence, pas l'unicité.
    expect(screen.getAllByText(fr.booking.nuits(3)).length).toBeGreaterThan(0);
  });

  it("jour indisponible : bouton désactivé, aucun onChange déclenché", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <BookingDatePicker
        unavailable={["2026-07-20"]}
        checkIn={null}
        checkOut={null}
        onChange={onChange}
        monthsToShow={1}
      />
    );

    const day20 = screen.getByText("20").closest("button");
    expect(day20).toBeDisabled();
    fireEvent.click(day20!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("jour passé : bouton désactivé (impossible de réserver hier)", () => {
    renderWithProviders(
      <BookingDatePicker
        unavailable={[]}
        checkIn={null}
        checkOut={null}
        onChange={vi.fn()}
        monthsToShow={1}
      />
    );
    // Horloge figée au 15 juillet : le 10 juillet est dans le passé.
    const day10 = screen.getByText("10").closest("button");
    expect(day10).toBeDisabled();
  });

  it("clic sur une date antérieure à l'arrivée choisie → repart sur une nouvelle sélection", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <BookingDatePicker
        unavailable={[]}
        checkIn="2026-07-20"
        checkOut={null}
        onChange={onChange}
        monthsToShow={1}
      />
    );

    fireEvent.click(screen.getByText("18")); // avant le 20 → nouvelle arrivée

    expect(onChange).toHaveBeenCalledWith("2026-07-18", null);
  });

  it("« Effacer » réinitialise la sélection", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <BookingDatePicker
        unavailable={[]}
        checkIn="2026-07-20"
        checkOut="2026-07-23"
        onChange={onChange}
        monthsToShow={1}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: fr.booking.effacer }));

    expect(onChange).toHaveBeenCalledWith(null, null);
  });

  it("navigation mois : le bouton « mois précédent » est désactivé au premier mois affiché", () => {
    renderWithProviders(
      <BookingDatePicker
        unavailable={[]}
        checkIn={null}
        checkOut={null}
        onChange={vi.fn()}
        monthsToShow={1}
      />
    );
    expect(screen.getByRole("button", { name: fr.booking.moisPrecedent })).toBeDisabled();
    expect(screen.getByRole("button", { name: fr.booking.moisSuivant })).not.toBeDisabled();
  });
});
