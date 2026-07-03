"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import { MailIcon, CloseIcon } from "@/components/icons";

const POLL_MS = 30_000;
const ENDPOINT = "/api/messages/unread-count";

/**
 * Notification in-app des nouveaux messages. Sonde périodiquement le nombre de
 * non-lus (cf. /api/messages/unread-count) et, quand il AUGMENTE :
 *   • affiche un toast cliquable (vers la messagerie) ;
 *   • déclenche une notification navigateur si l'utilisateur l'a autorisée.
 *
 * À chaque sonde, diffuse le compteur via l'événement « darna:unread » pour que
 * la pastille du menu (AccountMenu) reste synchrone sans rechargement de page.
 * Re-sonde aussi au retour de focus / d'onglet (réactif sans marteler le serveur).
 * Ne rend rien tant qu'aucun toast n'est actif.
 */
export function MessagesNotifier({ initialCount }: { initialCount: number }) {
  const fr = useT();
  const prev = useRef(initialCount);
  const [toast, setToast] = useState<{ count: number } | null>(null);

  const notifyBrowser = useCallback(
    (count: number) => {
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;
      try {
        new Notification(fr.messages.notifTitre, {
          body: fr.messages.notifCorps(count),
          tag: "darna-messages",
        });
      } catch {
        // Certains navigateurs interdisent le constructeur hors Service Worker.
      }
    },
    [fr]
  );

  const poll = useCallback(async () => {
    try {
      const res = await fetch(ENDPOINT, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { count?: number };
      const count = typeof data.count === "number" ? data.count : 0;

      // Pastille du menu synchronisée.
      window.dispatchEvent(new CustomEvent("darna:unread", { detail: count }));

      // Augmentation → nouveau(x) message(s) reçu(s) : on prévient.
      if (count > prev.current) {
        setToast({ count });
        notifyBrowser(count);
      }
      prev.current = count;
    } catch {
      // Réseau indisponible : on réessaiera à la prochaine sonde.
    }
  }, [notifyBrowser]);

  useEffect(() => {
    // Demande discrète d'autorisation des notifications (une seule fois).
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const id = window.setInterval(poll, POLL_MS);
    const onFocus = () => {
      if (document.visibilityState === "visible") poll();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [poll]);

  // Auto-fermeture du toast au bout de 7 s.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 7_000);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 end-4 z-[1300] w-[min(92vw,22rem)]"
    >
      <div className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-2xl ring-1 ring-darna/15">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-heading">
          <MailIcon width={18} height={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-heading">{fr.messages.notifTitre}</p>
          <p className="mt-0.5 text-xs text-body/65">{fr.messages.notifCorps(toast.count)}</p>
          <Link
            href="/dashboard/messagerie"
            onClick={() => setToast(null)}
            className="mt-2 inline-block text-xs font-semibold text-heading underline-offset-2 hover:underline"
          >
            {fr.messages.notifVoir}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setToast(null)}
          aria-label={fr.common.fermer}
          className="shrink-0 rounded-lg p-1 text-body/40 hover:bg-cream hover:text-body"
        >
          <CloseIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
