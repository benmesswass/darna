/**
 * `VerifiedBadge` — fraîcheur de vérification en résultats de recherche
 * (GROWTH_ROADMAP.md §G8). En mode `small` (cartes de recherche), le
 * vérificateur + la date n'apparaissent jamais en clair dans le badge
 * (pas d'encombrement visuel) mais doivent être disponibles au survol
 * (tooltip). En mode non-`small` (fiche détail), l'info reste inline comme
 * avant — pas de doublon dans le tooltip.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    badges: { verifieOnSite: "Certifié Wakil", verifieRemote: "Vérifié à distance" },
    property: {
      verifieOnSiteTooltip: "Vérifié sur place par un Wakil.",
      verifieOnSiteCriteres: "Critères Wakil",
      verifieRemoteTooltip: "Vérifié à distance par Darna.",
      verifieRemoteCriteres: "Critères vérification à distance",
      verifiePar: (name: string) => `Vérifié par ${name}`,
    },
  }),
}));
// Badges.tsx importe daysSincePublication de listings.ts, qui importe
// session/product-events (§IN1) — mocké pour ne jamais charger next-auth pour
// de vrai dans ce test de composant, sans rapport avec ce qui est testé ici.
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/product-events", () => ({ getAnonId: vi.fn(), logProductEvent: vi.fn() }));

const { VerifiedBadge } = await import("@/components/property/Badges");

describe("<VerifiedBadge /> — fraîcheur de vérification (§G8)", () => {
  it("mode small : n'affiche pas le vérificateur/date en clair", async () => {
    render(
      await VerifiedBadge({
        small: true,
        level: "ON_SITE",
        verifierName: "Kaïs",
        verifiedAt: new Date("2026-07-10"),
      })
    );
    expect(screen.getByText("Certifié Wakil")).toBeInTheDocument();
    expect(screen.queryByText(/Vérifié par Kaïs/)).not.toBeInTheDocument();
  });

  it("mode small : révèle le vérificateur/date au survol (tooltip)", async () => {
    render(
      await VerifiedBadge({
        small: true,
        level: "ON_SITE",
        verifierName: "Kaïs",
        verifiedAt: new Date("2026-07-10"),
      })
    );
    fireEvent.mouseEnter(screen.getByText("Certifié Wakil").closest("span.cursor-default")!);
    expect(screen.getByText(/Vérifié par Kaïs/)).toBeInTheDocument();
  });

  it("mode small sans vérificateur connu : pas de tooltip meta", async () => {
    render(await VerifiedBadge({ small: true, level: "ON_SITE" }));
    fireEvent.mouseEnter(screen.getByText("Certifié Wakil").closest("span.cursor-default")!);
    expect(screen.queryByText(/Vérifié par/)).not.toBeInTheDocument();
  });

  it("mode non-small : le vérificateur/date reste inline, pas dupliqué dans le tooltip", async () => {
    render(
      await VerifiedBadge({
        small: false,
        level: "REMOTE",
        verifierName: "Admin Darna",
        verifiedAt: new Date("2026-07-13"),
      })
    );
    expect(screen.getByText(/Vérifié par Admin Darna/)).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByText("Vérifié à distance").closest("span.cursor-default")!);
    // Un seul affichage du nom (inline), pas un deuxième dans le tooltip meta.
    expect(screen.getAllByText(/Vérifié par Admin Darna/)).toHaveLength(1);
  });
});
