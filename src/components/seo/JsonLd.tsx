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
 * - PAS de nonce CSP, et c'est voulu : `type="application/ld+json"` est un
 *   bloc de données inerte — l'algorithme « prepare a script » du standard
 *   HTML s'arrête avant toute exécution, donc script-src ne s'y applique pas.
 *   Un nonce y serait inutile ET provoquerait un mismatch d'hydratation
 *   (les navigateurs masquent l'attribut nonce dans le DOM par sécurité).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
