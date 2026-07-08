/**
 * Phase 2 — `RegisterForm` (P0 auth).
 *
 * Couvre : validation live du mismatch mot de passe (garde-fou CLIENT, avant
 * la revalidation serveur `.refine()`), l'exception UX assumée « inscription
 * indique que l'e-mail est déjà utilisé » (CLAUDE.md « Sécurité »), et la
 * redirection post-succès vers /connexion.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fr } from "@/lib/i18n/fr";
import { renderWithProviders } from "./helpers";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/actions/auth", () => ({
  registerAction: vi.fn(),
}));

const { registerAction } = await import("@/actions/auth");
const { RegisterForm } = await import("@/components/auth/AuthForms");
const registerMock = registerAction as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  registerMock.mockReset();
  replaceMock.mockReset();
});
afterEach(() => vi.clearAllMocks());

/**
 * `getByLabelText` exige une correspondance exacte du texte du label. Ici les
 * labels mot de passe / confirmation embarquent en permanence un indice live
 * (« règle » / message de correspondance, juste masqué en CSS) qui pollue leur
 * `textContent` — comportement voulu du composant (D9), pas un bug. On cible
 * donc ces deux champs par leur attribut `name`, comme le ferait le navigateur
 * via l'association implicite `label.control`.
 */
function passwordInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[name="password"]') as HTMLInputElement;
}
function confirmPasswordInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;
}

describe("<RegisterForm />", () => {
  it("affiche une erreur de correspondance dès que la confirmation diffère (avant soumission)", async () => {
    const { container } = renderWithProviders(<RegisterForm />);

    await userEvent.type(passwordInput(container), "motdepasse1");
    await userEvent.type(confirmPasswordInput(container), "autrechose1");

    expect(
      await screen.findByText(fr.profil.mdpConfirmationInvalide)
    ).toBeVisible();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("affiche le message assumé « compte déjà existant » renvoyé par l'action", async () => {
    registerMock.mockResolvedValue({
      error: fr.auth.emailDejaUtilise,
      values: { name: "Sami", email: "sami@darna.tn", phone: "", role: "VOYAGEUR" },
    });
    const { container } = renderWithProviders(<RegisterForm />);

    await userEvent.type(screen.getByLabelText(fr.auth.nom), "Sami");
    await userEvent.type(screen.getByLabelText(fr.auth.email), "sami@darna.tn");
    await userEvent.type(passwordInput(container), "motdepasse1");
    await userEvent.type(confirmPasswordInput(container), "motdepasse1");
    await userEvent.click(screen.getByRole("button", { name: fr.auth.sInscrire }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.auth.emailDejaUtilise);
  });

  it("redirige vers /connexion avec l'e-mail pré-rempli après une inscription réussie", async () => {
    registerMock.mockResolvedValue({
      success: fr.auth.inscriptionReussie,
      email: "nouveau@darna.tn",
    });
    const { container } = renderWithProviders(<RegisterForm />);

    await userEvent.type(screen.getByLabelText(fr.auth.nom), "Nouveau");
    await userEvent.type(screen.getByLabelText(fr.auth.email), "nouveau@darna.tn");
    await userEvent.type(passwordInput(container), "motdepasse1");
    await userEvent.type(confirmPasswordInput(container), "motdepasse1");
    await userEvent.click(screen.getByRole("button", { name: fr.auth.sInscrire }));

    await screen.findByText(fr.auth.inscriptionReussie);
    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("registered=1")
    );
    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("email=nouveau%40darna.tn")
    );
  });
});
