/**
 * Accès à l'utilisateur connecté côté serveur.
 * Implémenté avec NextAuth en phase 4 — stub neutre d'ici là.
 */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  kycStatus: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  return null;
}
