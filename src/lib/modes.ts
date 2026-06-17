/**
 * Aiguillage DÉMO ↔ PRODUCTION — point unique de vérité des « modes ».
 *
 * Principe : chaque brique de production est OPT-IN par configuration et tombe
 * sur un défaut DÉMO sûr quand la variable n'est pas posée. Le mode démo reste
 * donc 100 % fonctionnel sans aucune clé. Les contrôles stricts (fail-fast au
 * boot) vivent dans src/lib/env.ts ; ce module ne fait que LIRE les modes pour
 * aiguiller le runtime.
 *
 * Module SERVEUR uniquement (lit process.env). Ne jamais importer côté client.
 */

export type PaymentMode = "demo" | "konnect";
export type KycMode = "demo" | "production";
export type StorageMode = "local" | "s3";

/** Vrai en build/déploiement de production (`next start`). */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Mode de paiement. Défaut : `demo` (séquestre simulé). `konnect` n'est JAMAIS
 * activé implicitement par la simple présence des clés — il faut le poser
 * explicitement, ce qui évite d'ouvrir un paiement réel par erreur.
 */
export function paymentMode(): PaymentMode {
  return process.env.PAYMENT_MODE === "konnect" ? "konnect" : "demo";
}

/**
 * Mode KYC. Défaut : `demo` (OTP affiché à l'écran, statut DEMO_VERIFIE). En
 * `production` : SMS réel obligatoire, aucun code retourné au client, statut
 * VERIFIE réservé au workflow réel (cf. src/actions/kyc.ts).
 */
export function kycMode(): KycMode {
  return process.env.KYC_MODE === "production" ? "production" : "demo";
}

/**
 * Mode de stockage. Défaut : `local` (disque, serveur persistant). `s3` pour le
 * multi-instance. Rétro-compat : l'ancien `STORAGE_DRIVER=s3` reste reconnu.
 */
export function storageMode(): StorageMode {
  if (process.env.STORAGE_MODE === "s3" || process.env.STORAGE_DRIVER === "s3") {
    return "s3";
  }
  return "local";
}
