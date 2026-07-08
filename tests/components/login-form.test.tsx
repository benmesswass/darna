/**
 * Phase 2 — `LoginForm` (P0 auth).
 *
 * Anti-énumération (CLAUDE.md « Sécurité ») : l'action renvoie un message
 * D'ERREUR GÉNÉRIQUE, jamais « email inconnu » vs « mot de passe incorrect ».
 * On prouve que le composant AFFICHE fidèlement ce que l'action renvoie (pas
 * de message plus spécifique ajouté côté client) et transmet bien les champs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fr } from "@/lib/i18n/fr";
import { renderWithProviders } from "./helpers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/actions/auth", () => ({
  loginAction: vi.fn(),
}));

const { loginAction } = await import("@/actions/auth");
const { LoginForm } = await import("@/components/auth/AuthForms");
const loginMock = loginAction as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => loginMock.mockReset());
afterEach(() => vi.clearAllMocks());

describe("<LoginForm />", () => {
  it("rend les champs email/mot de passe et le CTA de connexion", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText(fr.auth.email)).toBeInTheDocument();
    expect(screen.getByLabelText(fr.auth.motDePasse)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: fr.auth.seConnecter })).toBeInTheDocument();
  });

  it("affiche le message d'erreur générique renvoyé par l'action (anti-énumération)", async () => {
    loginMock.mockResolvedValue({ error: fr.auth.identifiantsInvalides });
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText(fr.auth.email), "voyageur@darna.tn");
    await userEvent.type(screen.getByLabelText(fr.auth.motDePasse), "mauvais-mdp");
    await userEvent.click(screen.getByRole("button", { name: fr.auth.seConnecter }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.auth.identifiantsInvalides);
  });

  it("transmet callbackUrl en champ caché quand fourni", () => {
    const { container } = renderWithProviders(
      <LoginForm callbackUrl="/dashboard/reservations" />
    );
    expect(container.querySelector('input[name="callbackUrl"]')).toHaveValue(
      "/dashboard/reservations"
    );
  });

  it("affiche la bannière post-inscription quand registered=true et aucun état d'erreur", () => {
    renderWithProviders(<LoginForm registered />);
    expect(screen.getByRole("status")).toHaveTextContent(fr.auth.compteCreeConnectezVous);
  });
});
