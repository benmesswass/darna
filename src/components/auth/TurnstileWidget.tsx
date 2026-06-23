"use client";

import Script from "next/script";

/**
 * Widget Cloudflare Turnstile (rendu implicite). Placé À L'INTÉRIEUR du <form> :
 * le script injecte un champ caché `cf-turnstile-response` dans le conteneur, qui
 * part donc avec la soumission et est vérifié côté serveur (cf. src/lib/turnstile.ts).
 *
 * Le `nonce` est propagé au <script> pour satisfaire la CSP par nonce
 * (strict-dynamic) ; sans clé (`siteKey` vide) le composant ne rend rien.
 */
export function TurnstileWidget({
  siteKey,
  nonce,
}: {
  siteKey: string;
  nonce?: string;
}) {
  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        nonce={nonce}
      />
      <div className="cf-turnstile" data-sitekey={siteKey} data-language="auto" />
    </>
  );
}
