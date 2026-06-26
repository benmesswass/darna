/** « Enums » applicatifs — SQLite ne supporte pas les enums Prisma. */

export const ROLES = ["VOYAGEUR", "HOTE", "AGENCE", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

/** Durée de vie d'une réservation EN_ATTENTE avant expiration automatique. */
export const BOOKING_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

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
  "CONFIRMEE",
  "ANNULEE",
  "TERMINEE",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ESCROW_STATUSES = ["AUCUN", "EN_SEQUESTRE", "LIBERE"] as const;
export type EscrowStatus = (typeof ESCROW_STATUSES)[number];

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
