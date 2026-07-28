/** Configuration globale de Darna — aucun service externe, aucune clé API. */

/** Taux indicatif statique pour le mode diaspora (1 EUR = X TND). */
export const EUR_TO_TND = 3.4;

/** Frais de service Darna sur les séjours (transparents, affichés au récap). */
export const SERVICE_FEE_RATE = 0.1;

/**
 * Montant dû EN LIGNE pour un séjour (TND, entier) — modèle « commission-only »
 * (LANCEMENT_ROADMAP.md §L5.1, 2026-07-27) : Darna n'encaisse plus JAMAIS le
 * loyer, seulement ses propres frais restants (après réduction de
 * re-réservation/crédit éventuels — l'appelant passe `totalPrice - subtotal`,
 * jamais le `serviceFee` brut, sinon un geste commercial n'aurait plus aucun
 * effet sur ce qui est réellement débité). Plus de plancher `DEPOSIT_MIN_RATE`
 * ni de choix voyageur (ancien modèle, cf. historique git) : montant FIXE, le
 * loyer intégral se règle en espèces à l'hôte, à l'arrivée.
 *
 * Peut valoir `0` (frais intégralement couverts par un crédit, ou d'origine
 * déjà nuls) : `startKonnectPaymentAction` confirme alors directement, sans
 * passer par Konnect (qui n'accepterait de toute façon pas une charge nulle).
 */
export function computeDepositAmount(serviceFee: number): number {
  return Math.max(0, Math.round(serviceFee));
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

/**
 * Crédit de bienvenue générique, SANS parrain (CROISSANCE_ROADMAP.md §CR3) —
 * motif BIENVENUE_SPONTANE. Réservé aux comptes téléphone vérifié (anti-fake-
 * account, réutilise le gate KYC existant). Jamais cumulé avec le bonus
 * filleul (§CR1, BIENVENUE_PARRAINAGE) — un compte ne touche que l'un ou
 * l'autre. Cf. grantWelcomeCreditIfEligible, src/lib/credits.ts.
 */
export const WELCOME_CREDIT_TND = 10;

/** Plafond : au plus ce nombre de filleuls récompensés par parrain et par an glissant (§CR2). */
export const HOST_REFERRAL_YEARLY_CAP = 5;

/**
 * Part maximale des FRAIS DARNA (pas du total, §L5.1 — le loyer n'appartient
 * plus jamais à Darna) qu'un crédit peut couvrir au checkout (§CR1) — un
 * crédit ne réduit que l'argent de Darna, jamais le prix hôte. `100 %` :
 * décision Wassim 2026-07-27, le plancher réel reste de toute façon
 * `totalPrice - subtotal` (cf. computeCreditApplication) ; le taux existe
 * pour resserrer ce plafond plus tard si besoin (anti-abus).
 */
export const CREDIT_CHECKOUT_CAP_RATE = 1;

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
 * Réconciliation Konnect↔local (LANCEMENT_ROADMAP.md §L3.2) : un paiement
 * encore local "en attente" au-delà de ce délai déclenche une revérification
 * auprès de Konnect (webhook potentiellement manqué).
 */
export const PAYMENT_RECONCILIATION_STALE_MINUTES = 30;

/**
 * Relance de réservation abandonnée (LANCEMENT_ROADMAP.md §L3.3 /
 * GROWTH_ROADMAP.md §G6) : fenêtre après l'expiration du hold EN_ATTENTE
 * pendant laquelle une relance est encore pertinente.
 */
export const BOOKING_ABANDON_REMINDER_WINDOW_HOURS = 24;

/**
 * Garantie non-conformité (LANCEMENT_ROADMAP.md §L5.3) : fenêtre après le
 * check-in pendant laquelle un voyageur peut signaler que le logement ne
 * correspond pas à l'annonce. Avant `checkIn`, rien à signaler (le séjour n'a
 * pas commencé) ; au-delà, la fenêtre est jugée trop tardive pour distinguer
 * un problème d'arrivée d'un désagrément survenu en cours de séjour.
 */
export const NON_CONFORMITY_REPORT_WINDOW_HOURS = 24;

/**
 * Garantie no-show hôte (LANCEMENT_ROADMAP.md §L5.4) : fenêtre après le
 * check-in pendant laquelle un hôte peut déclarer un no-show voyageur —
 * rail ESCROW uniquement (le rail SUR_PLACE a son propre mécanisme sans
 * indemnité, cf. reportNoShowAction). Plus large que la fenêtre de
 * non-conformité (§L5.3, 24 h) : laisser à l'hôte le temps de constater
 * l'absence sans le presser sur un délai aussi court qu'un problème visible
 * dès l'arrivée.
 */
export const NO_SHOW_INDEMNITY_WINDOW_HOURS = 48;

/**
 * Plafond anti-abus : au plus ce nombre d'indemnités no-show versées à un
 * même hôte par mois glissant (30 jours). Constante PROVISOIRE (comme
 * REBOOKING_DISCOUNT_RATE etc.) — à ajuster une fois un volume réel
 * disponible. Vérification non atomique avec la réclamation elle-même
 * (lecture puis décision) : acceptable pour un plafond anti-abus provisoire
 * portant sur le revenu propre de Darna, pas une garantie de correction
 * financière stricte (contrairement à l'idempotence de la réclamation
 * elle-même, qui EST atomique — cf. claimNoShowIndemnityAction).
 */
export const NO_SHOW_INDEMNITY_MONTHLY_CAP = 3;

/**
 * Détection de spike d'échecs de connexion (LANCEMENT_ROADMAP.md §L4.3) —
 * compteur GLOBAL (tous utilisateurs/IP confondus, distinct du rate limiting
 * par IP de src/lib/rate-limit.ts) : un volume anormal d'échecs sur une courte
 * fenêtre peut signaler une attaque distribuée (credential stuffing) que le
 * rate limiting par IP seul ne détecte pas (chaque IP reste sous son propre
 * seuil). Alerte observabilité une seule fois par fenêtre (au moment où le
 * seuil est franchi), pas à chaque échec suivant.
 */
export const LOGIN_FAILURE_SPIKE_WINDOW_MINUTES = 5;
export const LOGIN_FAILURE_SPIKE_THRESHOLD = 20;
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

/**
 * Signal de dynamique temps réel sur la fiche annonce (GROWTH_ROADMAP.md §G5) :
 * seuils PROVISOIRES sous lesquels le signal reste masqué — jamais un chiffre
 * gonflé pour un 1 ou 2, cohérent avec le positionnement anti-bullshit (même
 * esprit que SUPER_HOST_MIN_REVIEWS).
 */
export const LISTING_ACTIVITY_MIN_VIEWS = 3;
/** Une dernière réservation trop ancienne n'est plus un signal de dynamique. */
export const LISTING_ACTIVITY_RECENT_BOOKING_DAYS = 30;

/**
 * Nudge promo automatique (CROISSANCE_ROADMAP.md §PM2) : ancienneté minimale
 * de vérification avant la 1ère suggestion — laisse le temps à l'annonce de
 * capter ses premières réservations organiques avant de suggérer une promo.
 */
export const PROMO_SUGGESTION_VERIFIED_SINCE_DAYS = 14;
/**
 * Fenêtre (jours à venir) sans réservation CONFIRMEE déclenchant la
 * suggestion de promo (§PM2) — « nuits vides » à court terme.
 */
export const PROMO_SUGGESTION_BOOKING_WINDOW_DAYS = 21;

/**
 * Rétention RGPD/CNIL (LANCEMENT_ROADMAP.md §L7 — régime d'exemption de
 * consentement « mesure d'audience »). Purgées par le job `retention-purge`
 * (src/lib/jobs/retention-purge.ts) — CES DURÉES SONT LA PROMESSE FAITE À
 * `/confidentialite` : ne jamais les changer sans mettre à jour la page en
 * même temps (et inversement).
 *
 * `darna-vid` (cookie) : durée de vie ≤ 13 mois — posée directement dans
 * src/middleware.ts (VISITOR_COOKIE_MAX_AGE, actuellement 365 j, conforme).
 */
/** ProductEvent : les données rattachées à l'identifiant, ≤ 25 mois (CNIL). */
export const PRODUCT_EVENT_RETENTION_DAYS = 760; // ≈ 25 mois
/**
 * PropertyView (dédup des vues annonce, `@@unique([propertyId, anonId])`) :
 * 13 mois — décision produit actée (LANCEMENT_ROADMAP.md §L7.2), pas une
 * contrainte CNIL en soi (la dédup de `viewCount` perd juste sa mémoire
 * au-delà, ce qui est acceptable ; 25 mois serait tout aussi conforme mais
 * inutilement long pour ce que sert réellement cette table).
 */
export const PROPERTY_VIEW_RETENTION_DAYS = 395; // ≈ 13 mois
/**
 * AuditLog : sécurité, PAS le régime CNIL mesure d'audience — TODO-
 * PRODUCTION.md exige ≥ 90 jours ; 13 mois les respecte largement tout en
 * restant aligné sur la durée de vie de `darna-vid` (simple à expliquer sur
 * une seule page confidentialité).
 */
export const AUDIT_LOG_RETENTION_DAYS = 395; // ≈ 13 mois
