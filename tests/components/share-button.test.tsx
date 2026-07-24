/**
 * `ShareButton` — instrumentation SHARE_CLICKED (INSTRUMENTATION_ROADMAP.md
 * §IN2). `trackEvent` est mocké : on vérifie le déclenchement et le canal,
 * pas l'écriture en base (couverte par tests/track-event.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fr } from "@/lib/i18n/fr";
import { renderWithProviders } from "./helpers";

vi.mock("@/actions/track-event", () => ({ trackEvent: vi.fn() }));

const { ShareButton } = await import("@/components/property/ShareButton");
const { trackEvent } = await import("@/actions/track-event");

const URL = "https://darna.tn/annonce/villa-hammamet";

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  // @ts-expect-error -- absent par défaut sous jsdom ; supprimé explicitement
  // pour forcer le menu déroulant (sinon un navigator.share résiduel d'un
  // test précédent fausserait le suivant).
  delete navigator.share;
});

describe("<ShareButton /> — instrumentation §IN2", () => {
  it("mesure SHARE_CLICKED (channel: copy) au clic sur Copier le lien", async () => {
    renderWithProviders(<ShareButton title="Villa Hammamet" url={URL} />);
    await userEvent.click(screen.getByRole("button", { name: fr.property.partager }));
    await userEvent.click(screen.getByRole("menuitem", { name: fr.property.copierLien }));

    expect(trackEvent).toHaveBeenCalledWith({
      event: "SHARE_CLICKED",
      metadata: { channel: "copy", context: "property" },
    });
  });

  it("mesure SHARE_CLICKED (channel: whatsapp) au clic sur WhatsApp", async () => {
    renderWithProviders(<ShareButton title="Villa Hammamet" url={URL} />);
    await userEvent.click(screen.getByRole("button", { name: fr.property.partager }));
    await userEvent.click(screen.getByRole("menuitem", { name: fr.property.whatsapp }));

    expect(trackEvent).toHaveBeenCalledWith({
      event: "SHARE_CLICKED",
      metadata: { channel: "whatsapp", context: "property" },
    });
  });

  it("mesure SHARE_CLICKED (channel: native) via navigator.share", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share: shareMock });

    renderWithProviders(<ShareButton title="Villa Hammamet" url={URL} />);
    await userEvent.click(screen.getByRole("button", { name: fr.property.partager }));

    expect(shareMock).toHaveBeenCalledWith({ title: "Villa Hammamet", text: undefined, url: URL });
    expect(trackEvent).toHaveBeenCalledWith({
      event: "SHARE_CLICKED",
      metadata: { channel: "native", context: "property" },
    });
  });

  it("ne mesure rien si l'utilisateur annule le partage natif (AbortError)", async () => {
    Object.assign(navigator, {
      share: vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError")),
    });

    renderWithProviders(<ShareButton title="Villa Hammamet" url={URL} />);
    await userEvent.click(screen.getByRole("button", { name: fr.property.partager }));

    expect(trackEvent).not.toHaveBeenCalled();
  });
});

describe("<ShareButton /> — réutilisation parrainage (§CR1)", () => {
  it("affiche le libellé personnalisé et distingue le contexte dans SHARE_CLICKED", async () => {
    renderWithProviders(
      <ShareButton title="Mes crédits" url={URL} label="Parrainer un ami" context="referral" />
    );
    await userEvent.click(screen.getByRole("button", { name: "Parrainer un ami" }));
    await userEvent.click(screen.getByRole("menuitem", { name: fr.property.copierLien }));

    expect(trackEvent).toHaveBeenCalledWith({
      event: "SHARE_CLICKED",
      metadata: { channel: "copy", context: "referral" },
    });
  });

  it("utilise le message personnalisé dans le lien WhatsApp plutôt que le message d'annonce par défaut", async () => {
    renderWithProviders(
      <ShareButton title="Mes crédits" url={URL} message="Rejoins Darna, 15 TND offerts !" context="referral" />
    );
    await userEvent.click(screen.getByRole("button", { name: fr.property.partager }));

    const whatsappLink = screen.getByRole("menuitem", { name: fr.property.whatsapp }) as HTMLAnchorElement;
    expect(decodeURIComponent(whatsappLink.href)).toContain("Rejoins Darna, 15 TND offerts !");
  });
});
