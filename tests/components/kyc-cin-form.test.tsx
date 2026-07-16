/**
 * Phase 2 (reliquat P1) — `CinVerifyFlow` (formulaire KYC, étape CIN).
 *
 * Couvre : rendu du champ CIN + CTA, affichage d'une erreur serveur
 * (numéro déjà utilisé par un autre compte — unicité inter-comptes),
 * bascule vers l'état "vérifié" (réel vs démo, libellés distincts),
 * et l'appel de `onVerified` une fois le statut vérifié.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fr } from "@/lib/i18n/fr";
import { renderWithProviders } from "./helpers";

vi.mock("@/actions/kyc", () => ({
  submitCinAction: vi.fn(),
}));

const { submitCinAction } = await import("@/actions/kyc");
const { CinVerifyFlow } = await import("@/components/dashboard/CinVerifyFlow");
const submitCinMock = submitCinAction as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => submitCinMock.mockReset());
afterEach(() => vi.clearAllMocks());

describe("<CinVerifyFlow />", () => {
  it("rend le champ CIN et le CTA quand le statut n'est pas encore vérifié", () => {
    renderWithProviders(<CinVerifyFlow initialStatus="NON_VERIFIE" />);
    expect(screen.getByText(fr.kyc.cin)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: fr.kyc.validerCin })
    ).toBeInTheDocument();
  });

  it("affiche l'erreur serveur (ex. CIN déjà utilisée par un autre compte)", async () => {
    submitCinMock.mockResolvedValue({ error: fr.kyc.cinDejaUtilisee });
    renderWithProviders(<CinVerifyFlow initialStatus="NON_VERIFIE" />);

    const input = document.querySelector('input[name="cin"]') as HTMLInputElement;
    await userEvent.type(input, "12345678");
    await userEvent.click(screen.getByRole("button", { name: fr.kyc.validerCin }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.kyc.cinDejaUtilisee);
  });

  it("affiche l'état vérifié RÉEL directement si initialStatus=VERIFIE (pas de formulaire)", () => {
    renderWithProviders(<CinVerifyFlow initialStatus="VERIFIE" />);
    expect(screen.getByText(fr.kyc.verifieBravo)).toBeInTheDocument();
    expect(document.querySelector('input[name="cin"]')).not.toBeInTheDocument();
  });

  it("distingue l'état vérifié DÉMO du vérifié réel (libellé dédié)", () => {
    renderWithProviders(<CinVerifyFlow initialStatus="DEMO_VERIFIE" />);
    expect(screen.getByText(fr.kyc.statutVerifieDemo)).toBeInTheDocument();
    expect(screen.getByText(fr.kyc.verifieDemoBravo)).toBeInTheDocument();
    expect(screen.queryByText(fr.kyc.verifieBravo)).not.toBeInTheDocument();
  });

  it("appelle onVerified une fois le statut vérifié après soumission", async () => {
    submitCinMock.mockResolvedValue({ verified: true });
    const onVerified = vi.fn();
    renderWithProviders(<CinVerifyFlow initialStatus="NON_VERIFIE" onVerified={onVerified} />);

    const input = document.querySelector('input[name="cin"]') as HTMLInputElement;
    await userEvent.type(input, "12345678");
    await userEvent.click(screen.getByRole("button", { name: fr.kyc.validerCin }));

    await screen.findByText(fr.kyc.verifieBravo);
    expect(onVerified).toHaveBeenCalledTimes(1);
  });
});
