import { headers } from "next/headers";

/**
 * Données structurées schema.org (JSON-LD).
 *
 * Unique exception encadrée à la règle « pas de dangerouslySetInnerHTML » :
 * React échappe les nœuds texte des <script> (les entités HTML ne sont pas
 * décodées dans un élément raw-text), ce qui corromprait le JSON. C'est
 * l'approche officiellement documentée par Next.js pour le JSON-LD.
 *
 * Sécurité :
 * - Contenu issu exclusivement de la base, sérialisé par JSON.stringify.
 * - « < » échappé en < pour interdire toute fermeture de tag.
 * - Le nonce CSP est lu depuis les headers de requête (posés par middleware.ts)
 *   afin que le script soit autorisé par la Content-Security-Policy.
 */
export async function JsonLd({ data }: { data: Record<string, unknown> }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
