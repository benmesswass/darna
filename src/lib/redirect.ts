/**
 * Valide un `callbackUrl` reçu en query/formulaire avant de l'utiliser comme
 * cible de redirection. N'autorise QUE des chemins internes relatifs pour
 * fermer la faille d'open redirect (`//evil.com`, `https://evil.com`,
 * `/\evil.com`…). Retourne le fallback si la valeur est absente ou suspecte.
 */
export function safeCallbackUrl(
  raw: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!raw) return fallback;
  // Doit commencer par "/" (chemin interne) mais pas "//" ni "/\" (protocole-relatif).
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }
  return raw;
}
