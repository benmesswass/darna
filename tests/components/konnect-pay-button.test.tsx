/**
 * Phase 2 — Composant `KonnectPayButton` (paiement, P0).
 *
 * Le bouton poste vers `startKonnectPaymentAction` (mockée ici) puis, selon la
 * réponse : affiche l'erreur (role="alert") OU redirige CÔTÉ CLIENT via
 * `window.location.href = payUrl` (compat CSP `form-action 'self'`). On prouve
 * ces deux branches sans dépendre du vrai serveur/Konnect.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fr } from "@/lib/i18n/fr";
import { renderWithProviders } from "./helpers";

vi.mock("@/actions/bookings", () => ({
  startKonnectPaymentAction: vi.fn(),
}));

const { startKonnectPaymentAction } = await import("@/actions/bookings");
const { KonnectPayButton } = await import("@/components/booking/KonnectPayButton");
const startMock = startKonnectPaymentAction as unknown as ReturnType<typeof vi.fn>;

// jsdom ne navigue pas : on remplace window.location par un stub à href mutable.
let originalLocation: Location;
beforeEach(() => {
  originalLocation = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { href: "" },
  });
  startMock.mockReset();
});
afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: originalLocation,
  });
});

describe("<KonnectPayButton />", () => {
  it("affiche le libellé de paiement et transmet bookingId (montant déterminé serveur, §L5.1)", async () => {
    startMock.mockResolvedValue({});
    const { container } = renderWithProviders(<KonnectPayButton bookingId="bk-1" />);

    expect(
      screen.getByRole("button", { name: fr.booking.payerKonnect })
    ).toBeInTheDocument();
    expect(container.querySelector('input[name="bookingId"]')).toHaveValue("bk-1");
    expect(container.querySelector('input[name="payAmount"]')).toBeNull();
  });

  it("affiche l'erreur serveur en zone d'alerte", async () => {
    startMock.mockResolvedValue({ error: "Montant invalide." });
    renderWithProviders(<KonnectPayButton bookingId="bk-1" />);

    await userEvent.click(screen.getByRole("button"));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Montant invalide.");
    expect(window.location.href).toBe("");
  });

  it("redirige vers payUrl côté client quand le paiement s'initialise", async () => {
    startMock.mockResolvedValue({ payUrl: "https://pay.konnect.test/xyz" });
    renderWithProviders(<KonnectPayButton bookingId="bk-1" />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(window.location.href).toBe("https://pay.konnect.test/xyz")
    );
  });
});
