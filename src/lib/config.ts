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
 * Durée de validité d'un crédit émis (programme parrainage/bienvenue,
 * CROISSANCE_ROADMAP.md §CR0) avant expiration automatique — ~6 mois, levier
 * de rentabilité (breakage, cf. §CR6). Compté depuis l'émission, par crédit
 * (pas par wallet) — cf. issueCredit, src/lib/credits.ts.
 */
export const CREDIT_VALIDITY_DAYS = 182;

/**
 * Bonus filleul (parrainage voyageur, CROISSANCE_ROADMAP.md §CR1) — crédité
 * IMMÉDIATEMENT à l'inscription via lien/code de parrainage valide, motif
 * BIENVENUE_PARRAINAGE. Distinct du bonus parrain (§CR2, cf.
 * HOST_REFERRAL_BONUS_TND) et du crédit de bienvenue générique sans parrain
 * (§CR3).
 */
export const REFERRAL_SIGNUP_BONUS_TND = 15;

/**
 * Bonus parrain (parrainage hôte, CROISSANCE_ROADMAP.md §CR2) — ≈ 2×
 * HOST_VERIFICATION_PRICE_TND. Crédité au PARRAIN (motif
 * PARRAINAGE_FILLEUL_TERMINE) quand le FILLEUL débloque le jalon : 1ère
 * annonce vérifiée ACTIVE + 1ère résa TERMINEE (pas seulement CONFIRMEE —
 * ferme la boucle réserver-puis-annuler). Cf. settleHostReferralMilestones,
 * src/lib/credits.ts.
 */
export const HOST_REFERRAL_BONUS_TND = 40;

/** Plafond : au plus ce nombre de filleuls récompensés par parrain et par an glissant (§CR2). */
export const HOST_REFERRAL_YEARLY_CAP = 5;

/**
 * Part maximale du total qu'un crédit peut couvrir au checkout (§CR1) — le
 * reste-à-couvrir (`totalPrice - subtotal`, cf. computeCreditApplication)
 * protège de toute façon le prix hôte ; ce taux limite en plus combien du
 * total le voyageur peut régler en crédit plutôt qu'en argent réel.
 */
export const CREDIT_CHECKOUT_CAP_RATE = 0.3;

/**
 * Signal réputationnel « annulé par l'hôte » (ANNULATION_HOTE_CORRECTIFS
 * _ROADMAP.md §AHC7, benchmark Airbnb) : chaque annulation hôte apparaît
 * comme une entrée système dans les avis de l'ANNONCE concernée, dès la 1re
 * (pas de seuil), sur une fenêtre glissante — décision produit du 2026-07-08.
 * Filtre paresseux à la lecture (comme cancelBlockedUntil), pas de cron.
 */
export const HOST_CANCELLATION_SIGNAL_DAYS = 90;

/**
 * Défi « Hôte Zéro Faille » (GROWTH_ROADMAP.md §G4) : seuils du badge
 * Super-Hôte, évalué sur la même fenêtre glissante que le signal
 * réputationnel ci-dessus (HOST_CANCELLATION_SIGNAL_DAYS) — un seul concept
 * de fenêtre plutôt que d'en inventer un second. PROVISOIRE, à confirmer une
 * fois un volume d'avis réel disponible.
 */
export const SUPER_HOST_MIN_RATING = 4.5;
/** Échantillon minimum d'avis pour éviter qu'un avis unique suffise. */
export const SUPER_HOST_MIN_REVIEWS = 3;

/** Durée de vie d'une annonce avant expiration (fraîcheur des données). */
export const LISTING_LIFETIME_DAYS = 30;

/** Seuil (jours restants) à partir duquel une annonce active est signalée
 *  « bientôt expirée » dans le centre de notifications (F9). */
export const LISTING_EXPIRE_SOON_DAYS = 5;

/** Seuil (jours restants) à partir duquel une HostInvoice EN_ATTENTE est
 *  signalée « bientôt due » (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP5). */
export const HOST_INVOICE_DUE_SOON_DAYS = 3;

/**
 * Score de complétude d'annonce (GROWTH_ROADMAP.md §G2) : seuils, PROVISOIRES,
 * choisis à partir de champs déjà présents sur Property — aucun nouveau champ.
 * `COMPLETENESS_MIN_PHOTOS` reprend directement AUDIT_V1.md Top 20 #12
 * (« Pousser 5+ photos minimum »), au-delà du minimum de 1 exigé à la création.
 */
export const COMPLETENESS_MIN_PHOTOS = 5;
/** Au-delà du minimum de 40 caractères exigé à la création (createSchema). */
export const COMPLETENESS_MIN_DESCRIPTION_LENGTH = 150;
export const COMPLETENESS_MIN_AMENITIES = 3;
/** Délai avant la première relance d'une annonce restée incomplète. */
export const LISTING_INCOMPLETE_NUDGE_DAYS = 3;

/** Mise en avant payante (« à la une ») : durée du boost et prix unique. */
export const FEATURED_DURATION_DAYS = 30;
/** Prix en TND du boost « à la une » pour un mois (tarif de lancement). */
export const FEATURED_PRICE_TND = 29;

/** Durée d'un cycle d'abonnement agence (MONETISATION_IMMO_ROADMAP.md §MI2). */
export const SUBSCRIPTION_DURATION_DAYS = 30;
/**
 * Palier gratuit (sans abonnement ACTIF) : nombre d'annonces actives
 * autorisées pour un compte AGENCE avant que la souscription (§MI1/MI2) ne
 * soit requise. Ne s'applique jamais aux comptes HOTE (cf.
 * src/lib/subscriptions.ts) — hypothèse provisoire, à réviser comme le prix
 * du palier STANDARD (cf. roadmap §Chiffrage).
 */
export const FREE_TIER_LISTINGS_LIMIT = 3;

/**
 * Vérifications Wakil gratuites À VIE pour un compte AGENCE
 * (MONETISATION_IMMO_ROADMAP.md §MI3) — décision Wassim du 2026-07-20 (revu à
 * la baisse depuis 3, cf. `git log` de ce fichier) : gagner la confiance
 * gratuitement au début, puis imposer un abonnement. Contrairement à
 * FREE_TIER_LISTINGS_LIMIT (un plafond, jamais consommé), ce nombre est un
 * SOLDE qui se consomme et ne se réinitialise jamais — cf.
 * src/lib/verification-credits.ts. Au-delà : le palier Starter accorde un
 * bonus ponctuel (`AGENCY_PLANS[].verificationCreditsBonus`), sinon achat
 * d'un lot prépayé (VERIFICATION_CREDIT_PACKS, src/lib/constants.ts) — jamais
 * de paiement à l'unité POUR UNE AGENCE (cf. HOST_VERIFICATION_PRICE_TND
 * ci-dessous pour le régime, différent, des particuliers).
 */
export const FREE_VERIFICATION_CREDITS = 1;

/**
 * Vérification Wakil pour un compte HOTE (particulier) — décision Wassim du
 * 2026-07-20 : RÉGIME DIFFÉRENT de l'agence, volontairement. Aucune
 * vérification gratuite, paiement À L'UNITÉ (pas de lot), et le paiement doit
 * être réglé AVANT que le Wakil ne puisse vérifier l'annonce — cf.
 * src/actions/host-verification-payments.ts, gate dans verifyPropertyAction
 * (src/actions/admin.ts). Réutilise le même mécanisme de solde
 * (VerificationWallet) qu'une agence : payer crédite +1, une vérification en
 * consomme 1 — seule la façon d'obtenir un crédit diffère (jamais gratuit,
 * jamais en lot).
 */
export const HOST_VERIFICATION_PRICE_TND = 20;

/** Occupation estivale estimée pour le Yield Advisor. */
export const SUMMER_OCCUPANCY_RATE = 0.6;

/**
 * Simulateur public de revenus (GROWTH_ROADMAP.md §G1) — borne basse d'occupation
 * pour la fourchette séjour (scénario prudent). La borne haute réutilise
 * SUMMER_OCCUPANCY_RATE ci-dessus (même hypothèse que le Yield Advisor).
 */
export const SIMULATOR_OCCUPANCY_LOW = 0.35;

/**
 * Simulateur public de revenus (§G1) — bande ± autour de la moyenne TND/m²
 * pour la fourchette location/vente (l'indice n'est pas assez granulaire pour
 * un intervalle calculé directement, contrairement à la nuitée séjour).
 */
export const SIMULATOR_ESTIMATE_BAND = 0.15;

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
