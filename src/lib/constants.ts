/** « Enums » applicatifs — SQLite ne supporte pas les enums Prisma. */

export const ROLES = ["VOYAGEUR", "HOTE", "AGENCE", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

/** Durée de vie d'une réservation EN_ATTENTE avant expiration automatique. */
export const BOOKING_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export const KYC_STATUSES = ["NON_VERIFIE", "EN_ATTENTE", "VERIFIE"] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

export const PROPERTY_TYPES = ["SEJOUR", "LOCATION", "VENTE"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

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
