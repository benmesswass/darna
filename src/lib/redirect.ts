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

/**
 * Page d'atterrissage par défaut après connexion (quand aucun `callbackUrl`
 * explicite n'est fourni) : si le compte n'est pas encore vérifié → la page de
 * vérification (e-mail + téléphone, + CIN pour les annonceurs) ; sinon →
 * l'accueil. Même définition de « vérifié » que le compteur du dashboard.
 */
export function defaultLandingPath(user: {
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: string;
}): string {
  const isLister = user.role === "HOTE" || user.role === "AGENCE";
  const kycVerified =
    user.kycStatus === "VERIFIE" || user.kycStatus === "DEMO_VERIFIE";
  const notVerified =
    !user.emailVerified || !user.phoneVerified || (isLister && !kycVerified);
  return notVerified ? "/dashboard/verifications" : "/";
}
