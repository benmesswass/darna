"use client";

import { useEffect, useRef } from "react";

/**
 * Widget Cloudflare Turnstile (rendu EXPLICITE).
 *
 * Le script est injecté via `document.createElement` depuis le bundle React —
 * lequel est déjà de confiance (nonce CSP). Avec `strict-dynamic`, tout script
 * créé par un script de confiance est lui aussi autorisé : pas besoin de poser
 * un nonce sur le script Turnstile, et plus de risque de mismatch de nonce
 * (cause classique du widget « invisible » sous CSP stricte).
 *
 * Rendu EXPLICITE (`render=explicit` + `turnstile.render`) car le scan
 * automatique du mode implicite ne se redéclenche PAS lors d'une navigation
 * client Next.js (ex. redirection inscription → connexion) — le widget
 * resterait alors absent sur la 2ᵉ page.
 *
 * Le widget pose un champ caché `cf-turnstile-response` dans le conteneur ; placé
 * dans le <form>, il part avec la soumission et est vérifié côté serveur
 * (cf. src/lib/turnstile.ts). Sans `siteKey`, le composant ne rend rien.
 */

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: { sitekey: string; language?: string }
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function TurnstileWidget({ siteKey }: { siteKey: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey) return;
    const container = ref.current;
    if (!container) return;

    let widgetId: string | undefined;

    function render() {
      if (!window.turnstile || !container) return;
      // Évite un double rendu (StrictMode / re-render) : conteneur déjà peuplé.
      if (container.childElementCount > 0) return;
      widgetId = window.turnstile.render(container, { sitekey: siteKey });
    }

    if (window.turnstile) {
      render();
    } else {
      let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render, { once: true });
    }

    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          /* widget déjà retiré : sans gravité */
        }
      }
    };
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={ref} />;
}
