"use client";

import { useEffect } from "react";

/**
 * Error boundary RACINE : ne se déclenche que si le layout racine lui-même
 * échoue → il REMPLACE le layout (donc plus de LocaleProvider ni de styles
 * globaux). Il doit fournir ses propres <html>/<body> et rester totalement
 * autonome : on s'autorise donc un texte FR en dur ici (cas catastrophe, hors
 * système i18n). Les erreurs sont capturées par onRequestError côté serveur.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(JSON.stringify({ level: "error", event: "client.global_error", digest: error.digest }));
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "5rem 1.5rem",
          color: "#1f2937",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Une erreur est survenue</h1>
        <p style={{ marginTop: "0.75rem", color: "#6b7280" }}>
          Veuillez réessayer dans un instant.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.625rem 1.5rem",
            borderRadius: "0.75rem",
            border: "none",
            background: "#1d6b5e",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
