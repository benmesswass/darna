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

/**
 * Délai de paiement d'une HostInvoice (Rail 2, paiement sur place) — compté
 * depuis la date de check-out de la réservation concernée. Paramètre business
 * à confirmer avec Wassim (cf. PAIEMENT_SUR_PLACE_ROADMAP.md §PSP3) ; valeur
 * provisoire raisonnable en attendant.
 */
export const HOST_INVOICE_DUE_DAYS = 14;

/**
 * Barème de blocage temporaire d'une annonce suite à une annulation À
 * L'INITIATIVE DE L'HÔTE (ANNULATION_HOTE_ROADMAP.md) : plus le préavis
 * laissé au voyageur est court, plus le blocage est long. Pivot du
 * 2026-07-06 — pas de pénalité financière (personne ne réglerait une
 * facture sur une plateforme naissante sans levier réel) : le seul
 * dissuasif est la perte de visibilité de l'annonce, cumulée à la
 * suspension progressive de compte (src/lib/suspension.ts).
 */
export function hostCancelBlockDays(daysUntilCheckIn: number): number {
  // §AHC6 — palier long recalibré 3j → 7j (décision produit du 2026-07-08) :
  // 3 jours de blocage pour une annulation à ≥30j de préavis était négligeable
  // (le barème ne mordait qu'en dessous de 7 jours). 7 jours reste mesuré pour
  // ne pas surpunir un hôte de bonne foi sur une plateforme naissante.
  if (daysUntilCheckIn >= 30) return 7;
  if (daysUntilCheckIn >= 7) return 15;
  return 30;
}

/**
 * Geste commercial (ANNULATION_HOTE_ROADMAP.md §AH4) : réduction ponctuelle
 * proposée au voyageur sur une suggestion de relogement après une annulation
 * hôte — 10 % du prix de la NOUVELLE réservation, plafonnée pour rester un
 * geste symbolique plutôt qu'une charge imprévisible pour Darna. Paramètres
 * business à confirmer avec Wassim, valeurs provisoires raisonnables.
 */
export const REBOOKING_DISCOUNT_RATE = 0.1;
export const REBOOKING_DISCOUNT_CAP_TND = 150;
/** Durée de validité du token de réduction (jours depuis l'annulation). */
export const REBOOKING_DISCOUNT_VALIDITY_DAYS = 30;

/**
 * Signal réputationnel « annulé par l'hôte » (ANNULATION_HOTE_CORRECTIFS
 * _ROADMAP.md §AHC7, benchmark Airbnb) : chaque annulation hôte apparaît
 * comme une entrée système dans les avis de l'ANNONCE concernée, dès la 1re
 * (pas de seuil), sur une fenêtre glissante — décision produit du 2026-07-08.
 * Filtre paresseux à la lecture (comme cancelBlockedUntil), pas de cron.
 */
export const HOST_CANCELLATION_SIGNAL_DAYS = 90;

/** Durée de vie d'une annonce avant expiration (fraîcheur des données). */
export const LISTING_LIFETIME_DAYS = 30;

/** Seuil (jours restants) à partir duquel une annonce active est signalée
 *  « bientôt expirée » dans le centre de notifications (F9). */
export const LISTING_EXPIRE_SOON_DAYS = 5;

/** Seuil (jours restants) à partir duquel une HostInvoice EN_ATTENTE est
 *  signalée « bientôt due » (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP5). */
export const HOST_INVOICE_DUE_SOON_DAYS = 3;

/** Mise en avant payante (« à la une ») : durée du boost et prix unique. */
export const FEATURED_DURATION_DAYS = 30;
/** Prix en TND du boost « à la une » pour un mois (tarif de lancement). */
export const FEATURED_PRICE_TND = 29;

/** Occupation estivale estimée pour le Yield Advisor. */
export const SUMMER_OCCUPANCY_RATE = 0.6;

/** URL canonique du site (SEO). */
export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

/**
 * Anti-bypass messagerie : au-delà de ce nombre de messages contenant des
 * coordonnées masquées (sur l'ensemble de ses réservations), l'utilisateur est
 * escaladé (journalisé en MESSAGE_BYPASS_ESCALATION → suivi admin / base d'une
 * future suspension).
 */
export const MESSAGE_FLAG_ESCALATION_THRESHOLD = 3;

/**
 * Au-delà de ce nombre de messages contenant des coordonnées masquées, le
 * compte est RÉELLEMENT suspendu (réservation + messagerie bloquées jusqu'à
 * réactivation par un admin). Strictement supérieur au seuil d'escalade : le
 * « dernier avertissement » précède la suspension.
 */
export const MESSAGE_FLAG_SUSPENSION_THRESHOLD = 4;

/**
 * Suspension PROGRESSIVE : durée (en jours) de chaque suspension successive. La
 * 1re suspension est courte (avertissement « pour de vrai »), puis ça s'allonge.
 * Au-delà de la liste, la suspension devient indéfinie (revue par un admin).
 * Modèle volontairement souple : on éduque avant de bannir.
 */
export const SUSPENSION_DURATIONS_DAYS = [3, 14];
