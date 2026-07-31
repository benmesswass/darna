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

import type { Vertical } from "@/lib/constants";

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
 * `production` : envoi réel obligatoire, aucun code retourné au client, statut
 * VERIFIE réservé au workflow réel (cf. src/actions/kyc.ts).
 *
 * DÉRIVÉ DU CANAL OTP : un canal réel (tout `OTP_PROVIDER` ≠ `sms`, p. ex.
 * `meta-whatsapp`) implique forcément un envoi réel → on bascule en
 * `production` même si `KYC_MODE` n'est pas posé. Cela supprime le piège « OTP
 * vraiment envoyé sur WhatsApp mais utilisateur seulement DEMO_VERIFIE ». Le
 * canal `sms` reste le seul à dégradation démo possible (cf. src/lib/sms.ts),
 * d'où le besoin de `KYC_MODE=production` explicite pour le forcer. Rétro-compat :
 * `KYC_MODE=production` force toujours `production`.
 */
export function kycMode(): KycMode {
  if (process.env.KYC_MODE === "production") return "production";
  if (getOtpProvider() !== "sms") return "production";
  return "demo";
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

/**
 * Activation des verticales (feature flags par module). Défaut : les DEUX
 * activées — seule la valeur explicite "false" désactive une verticale, donc la
 * démo reste complète sans aucune config. La garde au boot (src/lib/env.ts)
 * interdit de désactiver les deux à la fois (site sans contenu). Un déploiement
 * mono-verticale (split physique futur) se fait alors par simple config.
 */
export function stayEnabled(): boolean {
  return process.env.STAY_ENABLED !== "false";
}

export function immoEnabled(): boolean {
  return process.env.IMMO_ENABLED !== "false";
}

/** Verticale active ? Aiguillage unique pour le gating des routes/nav. */
export function verticalEnabled(vertical: Vertical): boolean {
  return vertical === "STAY" ? stayEnabled() : immoEnabled();
}

/**
 * PR3 — Gating KYC sur la création d'annonces. Défaut : `false` (démo, pas de
 * blocage). `KYC_GATING=on` exige que le propriétaire soit vérifié (VERIFIE ou
 * DEMO_VERIFIE) pour publier une annonce.
 */
export function kycGatingEnabled(): boolean {
  return process.env.KYC_GATING === "on";
}

/**
 * PR4 — Provider OTP. Détermine le canal d'envoi OTP :
 *  • `sms` (défaut) — SMS via SMS_PROVIDER (comportement historique).
 *  • `meta-whatsapp` — WhatsApp Business API (META_WHATSAPP_PHONE_ID requis).
 */
export type OtpProvider = "sms" | "meta-whatsapp";

export function getOtpProvider(): OtpProvider {
  return process.env.OTP_PROVIDER === "meta-whatsapp" ? "meta-whatsapp" : "sms";
}

/**
 * CAPTCHA anti-robot sur les formulaires auth. Défaut : `off` (aucune friction
 * en démo, aucune clé requise). `turnstile` active Cloudflare Turnstile (gratuit,
 * respectueux de la vie privée). Comme pour Konnect, l'activation est EXPLICITE :
 * la présence des clés ne suffit pas. La complétude de la config (clés présentes)
 * est garantie au boot par src/lib/env.ts.
 */
export type CaptchaMode = "off" | "turnstile";

export function captchaMode(): CaptchaMode {
  return process.env.CAPTCHA_MODE === "turnstile" ? "turnstile" : "off";
}

/**
 * P6.2 (ROADMAP.md) — surface de monétisation sans utilisateur au lancement :
 * boost payant (« à la une »), abonnement agence, packs de crédits de
 * vérification agence. Défaut : `false` (masqué) — « on ne vend pas de la
 * visibilité sur une place vide ». Passer à `true` au lancement réel, aucune
 * suppression de code nécessaire (réversible en une variable).
 *
 * NE couvre PAS la vérification Wakil à l'unité pour un compte HOTE
 * (src/actions/host-verification-payments.ts) : régime différent et
 * délibéré (décision Wassim du 2026-07-20, jamais gratuit), hors périmètre
 * de ce flag.
 */
export function growthMonetizationEnabled(): boolean {
  return process.env.GROWTH_MONETIZATION_ENABLED === "true";
}
