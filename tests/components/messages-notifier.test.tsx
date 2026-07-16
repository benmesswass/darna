/**
 * Phase 2 (reliquat P1) — `MessagesNotifier` : positionnement du toast
 * (règle durable CLAUDE.md — seul autre élément flottant en bas du site, côté
 * OPPOSÉ à `HistoryNav`).
 *
 * Ancré `fixed bottom-4 end-4` — jamais `start` (réservé à HistoryNav) pour
 * ne jamais recouvrir ses boutons. Rien n'est rendu tant qu'aucun toast n'est
 * actif (compteur de non-lus qui augmente).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { MessagesNotifier } from "@/components/messages/MessagesNotifier";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("<MessagesNotifier /> — positionnement", () => {
  it("ne rend rien tant qu'aucun nouveau message (compteur inchangé)", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ count: 0 }) })
    );
    const { container } = render(
      <LocaleProvider locale="fr">
        <MessagesNotifier initialCount={0} />
      </LocaleProvider>
    );
    expect(container.querySelector(".fixed")).not.toBeInTheDocument();
  });

  it("toast : ancré fixed bottom-4 end-4 (jamais start, côté opposé à HistoryNav)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ count: 2 }) })
    );
    const { container } = render(
      <LocaleProvider locale="fr">
        <MessagesNotifier initialCount={0} />
      </LocaleProvider>
    );

    // Déclenche la sonde périodique (compteur 0 → 2 : nouveau message reçu).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    const toast = container.querySelector(".fixed");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass("fixed", "bottom-4", "end-4");
    // Garde explicite : jamais côté "start" (réservé à HistoryNav) ni "top".
    expect(toast?.className).not.toMatch(/\bstart-4\b/);
    expect(toast?.className).not.toMatch(/\btop-/);
  });
});
