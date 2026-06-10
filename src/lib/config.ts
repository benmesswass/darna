/** Configuration globale de Darna — aucun service externe, aucune clé API. */

/** Taux indicatif statique pour le mode diaspora (1 EUR = X TND). */
export const EUR_TO_TND = 3.4;

/** Frais de service Darna sur les séjours (transparents, affichés au récap). */
export const SERVICE_FEE_RATE = 0.08;

/** Durée de vie d'une annonce avant expiration (fraîcheur des données). */
export const LISTING_LIFETIME_DAYS = 30;

/** Occupation estivale estimée pour le Yield Advisor. */
export const SUMMER_OCCUPANCY_RATE = 0.6;

/** URL canonique du site (SEO). */
export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
