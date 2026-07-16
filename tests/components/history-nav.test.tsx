/**
 * Phase 2 (reliquat P1) — `HistoryNav` : positionnement du contrôle flottant
 * précédent/suivant (règle durable CLAUDE.md).
 *
 * Ancré `fixed bottom-4 start-4` — délibérément jamais en haut (chevauche
 * systématiquement le H1) et jamais côté `end` (réservé à `MessagesNotifier`,
 * seul autre élément flottant en bas du site). Ce test garde cette invariante :
 * un futur changement de classe casserait silencieusement la règle de
 * non-recouvrement sans lever d'alerte ailleurs.
 */
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";

let mockPathname = "/annonce/villa-hammamet";
const backMock = { current: () => {} };
const forwardMock = { current: () => {} };

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: () => backMock.current(),
    forward: () => forwardMock.current(),
    push: () => {},
  }),
  usePathname: () => mockPathname,
}));

const { HistoryNav } = await import("@/components/layout/HistoryNav");

describe("<HistoryNav /> — positionnement", () => {
  it("sur une page interne : ancré fixed bottom-4 start-4 (jamais end, jamais en haut)", () => {
    mockPathname = "/annonce/villa-hammamet";
    sessionStorage.clear();
    const { container } = render(
      <LocaleProvider locale="fr">
        <HistoryNav />
      </LocaleProvider>
    );

    const nav = container.querySelector(".fixed");
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass("fixed", "bottom-4", "start-4");
    // Garde explicite : jamais côté "end" (réservé à MessagesNotifier) ni "top".
    expect(nav?.className).not.toMatch(/\bend-4\b/);
    expect(nav?.className).not.toMatch(/\btop-/);
  });

  it("sur la page d'accueil (plancher de navigation) : aucun bouton « précédent »", () => {
    mockPathname = "/";
    sessionStorage.clear();
    const { container } = render(
      <LocaleProvider locale="fr">
        <HistoryNav />
      </LocaleProvider>
    );
    // Ni back (on est au plancher) ni forward (aucun flag posé) : rien ne flotte.
    expect(container.querySelector(".fixed")).not.toBeInTheDocument();
  });
});
