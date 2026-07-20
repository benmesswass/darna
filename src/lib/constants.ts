/** « Enums » applicatifs — SQLite ne supporte pas les enums Prisma. */

export const ROLES = ["VOYAGEUR", "HOTE", "AGENCE", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

/** Durée de vie d'une réservation EN_ATTENTE avant expiration automatique. */
export const BOOKING_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Durée de vie d'une demande EN_ATTENTE_ACCEPTATION (Rail 2, paiement sur
 * place) avant expiration automatique — beaucoup plus longue que le hold de
 * paiement (BOOKING_EXPIRY_MS) : l'hôte doit avoir le temps de réagir, il n'y
 * a pas d'urgence de paiement à créer côté voyageur. Cf.
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP3.
 */
export const HOST_ACCEPTANCE_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 heures

/** Cookie de report de l'onboarding « Vérifications » (« Passer pour l'instant »). */
export const VERIF_SKIP_COOKIE = "darna-verif-skip";

// DEMO_VERIFIE : vérifié en MODE DÉMO (OTP affiché à l'écran). Distinct de VERIFIE
// (vérification réelle par SMS) pour ne jamais confondre confiance réelle et démo.
export const KYC_STATUSES = [
  "NON_VERIFIE",
  "EN_ATTENTE",
  "VERIFIE",
  "DEMO_VERIFIE",
] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

export const PROPERTY_TYPES = ["SEJOUR", "LOCATION", "VENTE"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

/**
 * Tris proposés à la recherche (séjours + immo). Référentiel client-safe (pas
 * d'env) : partagé par le sélecteur de tri (client) et le calcul du `orderBy`
 * Prisma (serveur, src/lib/listings.ts). `recommande` (défaut) = mise en avant
 * payante puis vérifiées puis récentes.
 */
export const SEARCH_SORTS = [
  "recommande",
  "prix-asc",
  "prix-desc",
  "avis-desc",
  "avis-asc",
  "recent",
] as const;
export type SortKey = (typeof SEARCH_SORTS)[number];

/** Normalise un `tri` reçu de l'URL en clé valide (défaut : recommande). */
export function parseSortKey(value: string | undefined): SortKey {
  return SEARCH_SORTS.includes((value ?? "") as SortKey)
    ? (value as SortKey)
    : "recommande";
}


/**
 * Indicatifs téléphoniques proposés au KYC (Tunisie + diaspora ciblée).
 * Tunisie en tête (propriétaire = souvent sur place) ; France ensuite (cible
 * diaspora prioritaire). Données de référentiel — libellés en français, comme
 * geo.ts. Le code est ce qui compte (composition E.164 côté serveur).
 */
export const PHONE_COUNTRIES = [
  { code: "216", label: "Tunisie", flag: "🇹🇳" },
  { code: "33", label: "France", flag: "🇫🇷" },
  { code: "32", label: "Belgique", flag: "🇧🇪" },
  { code: "49", label: "Allemagne", flag: "🇩🇪" },
  { code: "41", label: "Suisse", flag: "🇨🇭" },
  { code: "39", label: "Italie", flag: "🇮🇹" },
  { code: "44", label: "Royaume-Uni", flag: "🇬🇧" },
  { code: "1", label: "USA / Canada", flag: "🇺🇸" },
] as const;
export const DEFAULT_PHONE_COUNTRY = "216";

/**
 * Libellés de pays proposés à l'inscription (= référentiel PHONE_COUNTRIES).
 * Stockés tels quels en base (libellés FR), comme les villes/équipements.
 * Servent au pilotage diaspora dans le tableau de bord founder.
 */
export const COUNTRY_LABELS = PHONE_COUNTRIES.map((c) => c.label);
export const DEFAULT_COUNTRY = "Tunisie";
export function isValidCountry(value: string): boolean {
  return (COUNTRY_LABELS as readonly string[]).includes(value);
}

/**
 * Verticales du produit — frontière de module ET de feature-flag (cf.
 * src/modules/README.md). DISTINCT du `type` d'annonce : STAY ⊃ {SEJOUR} ;
 * IMMO ⊃ {LOCATION, VENTE}. L'activation/désactivation par config vit dans
 * src/lib/modes.ts (stayEnabled/immoEnabled). Module client-safe (pas de env).
 */
export const VERTICALS = ["STAY", "IMMO"] as const;
export type Vertical = (typeof VERTICALS)[number];

/** Types d'annonce regroupés par verticale. */
export const TYPES_BY_VERTICAL: Record<Vertical, readonly PropertyType[]> = {
  STAY: ["SEJOUR"],
  IMMO: ["LOCATION", "VENTE"],
};

/** Verticale d'un type d'annonce. SEJOUR → STAY ; LOCATION/VENTE → IMMO. */
export function verticalOfType(type: string): Vertical {
  return type === "SEJOUR" ? "STAY" : "IMMO";
}

/** Limites d'upload de photos — partagées client (dropzone) et serveur (uploads). */
export const MAX_PHOTOS_PER_PROPERTY = 8;
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 Mo

export const PROPERTY_STATUSES = ["ACTIVE", "LOUE", "VENDU", "EXPIREE"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const BOOKING_STATUSES = [
  "EN_ATTENTE",
  // Rail 2 (paiement sur place) : demande en attente d'acceptation par
  // l'hôte, distincte de EN_ATTENTE (hold de paiement) — cf. PAIEMENT_SUR_
  // PLACE_ROADMAP.md §PSP3, "Question produit" (acceptation hôte requise,
  // aucune garantie financière ne permet une confirmation instantanée).
  "EN_ATTENTE_ACCEPTATION",
  "CONFIRMEE",
  "ANNULEE",
  "TERMINEE",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ESCROW_STATUSES = ["AUCUN", "EN_SEQUESTRE", "LIBERE"] as const;
export type EscrowStatus = (typeof ESCROW_STATUSES)[number];

/**
 * Rail de paiement d'une réservation (PAIEMENT_SUR_PLACE_ROADMAP.md).
 * ESCROW = séquestre Konnect (défaut, comportement actuel). SUR_PLACE = Rail 2,
 * zéro paiement en ligne, commission facturée à l'hôte après coup (HostInvoice).
 */
export const PAYMENT_MODES = ["ESCROW", "SUR_PLACE"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

/**
 * Statut d'une HostInvoice (commission Rail 2 due par l'hôte). VOLONTAIREMENT
 * pas de valeur "EN_RETARD" : le retard est un DÉRIVÉ (EN_ATTENTE + dueAt <
 * now), jamais stocké — cf. PAIEMENT_SUR_PLACE_ROADMAP.md §PSP6.
 */
export const HOST_INVOICE_STATUSES = ["EN_ATTENTE", "PAYEE"] as const;
export type HostInvoiceStatus = (typeof HOST_INVOICE_STATUSES)[number];

/**
 * Statuts d'un achat de mise en avant (« à la une », MONETISATION_IMMO_ROADMAP.md
 * §MI0) — même esprit que HOST_INVOICE_STATUSES, aucun statut "ANNULEE" stocké :
 * une commande jamais réglée reste simplement EN_ATTENTE indéfiniment (aucun
 * effet métier tant qu'elle n'est pas payée).
 */
export const FEATURED_ORDER_STATUSES = ["EN_ATTENTE", "PAYEE"] as const;
export type FeaturedOrderStatus = (typeof FEATURED_ORDER_STATUSES)[number];

/**
 * Statuts d'un abonnement agence (MONETISATION_IMMO_ROADMAP.md §MI1) — même
 * esprit que FEATURED_ORDER_STATUSES : aucun statut "EXPIRE" stocké,
 * l'expiration est un DÉRIVÉ (ACTIF + currentPeriodEnd < now), jamais écrit
 * en base (l'application de cette dérivation arrive avec MI2).
 */
export const SUBSCRIPTION_STATUSES = ["EN_ATTENTE", "ACTIF"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/**
 * Paliers d'abonnement agence (MONETISATION_IMMO_ROADMAP.md §MI1/MI2). Trois
 * paliers — tarif de lancement décidé par Wassim le 2026-07-16 (revu à la
 * baisse par rapport à l'hypothèse initiale de §Chiffrage, jugée trop chère
 * pour le marché tunisien tant que Darna construit sa confiance) : toujours
 * PROVISOIRE, à réviser après un vrai test terrain. `Subscription.plan`
 * référence la clé `key` d'un palier ci-dessous.
 */
// `verificationCreditsBonus` (MI3, décision Wassim du 2026-07-20) : crédits de
// vérification Wakil offerts UNE SEULE FOIS à la 1re activation de ce palier
// (jamais reconduit aux renouvellements — cf. Subscription.starterBonusGranted,
// src/lib/subscription-payments.ts + src/actions/subscriptions.ts). Seul
// Starter en a un ; 0 pour les autres paliers ("le reste ne change pas").
export const AGENCY_PLANS = [
  { key: "STARTER", label: "Starter", listingsIncluded: 3, priceTND: 50, verificationCreditsBonus: 3 },
  { key: "STANDARD", label: "Standard", listingsIncluded: 10, priceTND: 100, verificationCreditsBonus: 0 },
  { key: "PRO", label: "Pro", listingsIncluded: 30, priceTND: 200, verificationCreditsBonus: 0 },
] as const;
export type AgencyPlanKey = (typeof AGENCY_PLANS)[number]["key"];

/**
 * Lots de crédits de vérification Wakil pour un compte AGENCE
 * (MONETISATION_IMMO_ROADMAP.md §MI3) — décision Wassim du 2026-07-16 :
 * FREE_VERIFICATION_CREDITS (src/lib/config.ts) gratuites À VIE + le bonus
 * Starter ci-dessus, puis UNIQUEMENT ces deux lots prépayés (jamais de
 * paiement à l'unité pour une agence — cf. HOST_VERIFICATION_PRICE_TND pour
 * le régime différent des particuliers). Prix PROVISOIRE — non confronté à
 * une vraie agence, à réviser comme AGENCY_PLANS.
 * `VerificationCreditOrder.credits`/`.amount` référencent un lot ci-dessous.
 */
export const VERIFICATION_CREDIT_PACKS = [
  { key: "PACK10", credits: 10, priceTND: 40 },
  { key: "PACK25", credits: 25, priceTND: 90 },
] as const;
export type VerificationCreditPackKey = (typeof VERIFICATION_CREDIT_PACKS)[number]["key"];

export const CANCEL_POLICIES = ["FLEXIBLE", "MODEREE", "FERME", "STRICTE"] as const;
export type CancelPolicy = (typeof CANCEL_POLICIES)[number];

/** Équipements proposés à la création d'annonce (libellés FR stockés tels quels). */
export const AMENITIES = [
  "Climatisation",
  "Wifi",
  "Piscine",
  "Vue mer",
  "Parking",
  "Cuisine équipée",
  "Terrasse",
  "Jardin",
  "Ascenseur",
  "Chauffage",
  "Lave-linge",
  "Proche plage",
] as const;
export type Amenity = (typeof AMENITIES)[number];

/** Types de bien séjour (F5 roadmap) — libellés FR stockés tels quels (cf. AMENITIES). */
export const STAY_KINDS = ["Villa", "Appartement", "Studio", "Maison d'hôtes", "Maison"] as const;
export type StayKind = (typeof STAY_KINDS)[number];

/** Normalise le paramètre `typeBien` de l'URL en valeur valide, ou null. */
export function parseStayKindParam(value: string | undefined): StayKind | null {
  return value && (STAY_KINDS as readonly string[]).includes(value) ? (value as StayKind) : null;
}

/**
 * Normalise le paramètre `equipements` de l'URL (case à cocher répétée → string
 * ou string[] selon Next.js) en liste d'équipements valides, sans doublons.
 * Rejette toute valeur hors référentiel (le filtre de recherche l'utilise
 * ensuite dans un `contains` Prisma — on ne veut filtrer que sur du connu).
 */
export function parseAmenitiesParam(value: string | string[] | undefined): Amenity[] {
  const raw = value === undefined ? [] : Array.isArray(value) ? value : [value];
  return [...new Set(raw.filter((v): v is Amenity => (AMENITIES as readonly string[]).includes(v)))];
}
