/** Configuration globale de Darna — aucun service externe, aucune clé API. */

/** Taux indicatif statique pour le mode diaspora (1 EUR = X TND). */
export const EUR_TO_TND = 3.4;

/** Frais de service Darna sur les séjours (transparents, affichés au récap). */
export const SERVICE_FEE_RATE = 0.08;

/**
 * Acompte MINIMUM réglé en ligne à la réservation (borne basse, % du total).
 * Anti-bypass : aucune coordonnée n'est partagée avant qu'au moins cet acompte
 * soit payé. La commission Darna (serviceFee) y est ENTIÈREMENT contenue — le
 * revenu plateforme est donc garanti dès le premier dinar encaissé en ligne.
 */
export const DEPOSIT_MIN_RATE = 0.1;

/**
 * Acompte minimum dû EN LIGNE pour un séjour (TND, entier). Borne basse du
 * montant que le voyageur peut choisir de régler : `max(10 % du total,
 * commission Darna)` — garantit que la commission est toujours encaissée — et
 * jamais au-dessus du total. Calculé/figé côté serveur à la création du hold.
 */
export function computeDepositAmount(totalPrice: number, serviceFee: number): number {
  const min = Math.max(Math.ceil(totalPrice * DEPOSIT_MIN_RATE), serviceFee);
  return Math.min(min, totalPrice);
}

/**
 * Clampe un montant de paiement CHOISI par le voyageur dans l'intervalle
 * autorisé `[depositAmount, totalPrice]`. Jamais de confiance au client : un
 * montant sous l'acompte est remonté au minimum, au-dessus du total ramené au
 * total, et une valeur non finie retombe sur l'acompte. Toujours arrondi.
 */
export function clampPayAmount(
  payAmount: number,
  depositAmount: number,
  totalPrice: number
): number {
  if (!Number.isFinite(payAmount)) return depositAmount;
  return Math.min(Math.max(Math.round(payAmount), depositAmount), totalPrice);
}

/** Durée de vie d'une annonce avant expiration (fraîcheur des données). */
export const LISTING_LIFETIME_DAYS = 30;

/** Mise en avant payante (« à la une ») : durée du boost et prix unique. */
export const FEATURED_DURATION_DAYS = 7;
/** Prix en TND du boost « à la une » pour une semaine (paiement mock). */
export const FEATURED_PRICE_TND = 49;

/** Occupation estivale estimée pour le Yield Advisor. */
export const SUMMER_OCCUPANCY_RATE = 0.6;

/** URL canonique du site (SEO). */
export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
