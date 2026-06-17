"use client";

import { useEffect } from "react";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Error boundary de segment. Les erreurs serveur sont déjà capturées en central
 * par `onRequestError` (cf. src/instrumentation.ts) ; ici on offre un repli UX
 * gracieux + un bouton de réessai, et on trace le `digest` côté client pour la
 * corrélation avec le log serveur.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const fr = useT();

  useEffect(() => {
    console.error(JSON.stringify({ level: "error", event: "client.route_error", digest: error.digest }));
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="text-2xl font-bold text-darna">{fr.common.erreurInconnue}</h1>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-darna px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-darna-light"
      >
        {fr.common.reessayer}
      </button>
    </div>
  );
}
