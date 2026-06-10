/**
 * Données structurées schema.org (JSON-LD).
 *
 * Unique exception encadrée à la règle « pas de dangerouslySetInnerHTML » :
 * React échappe les nœuds texte des <script> (les entités HTML ne sont pas
 * décodées dans un élément raw-text), ce qui corromprait le JSON. C'est
 * l'approche officiellement documentée par Next.js pour le JSON-LD.
 * Sécurité : contenu issu exclusivement de la base, sérialisé par
 * JSON.stringify, avec « < » échappé pour interdire toute fermeture de tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
