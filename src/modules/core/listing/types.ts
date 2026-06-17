import type { getPropertyBySlug } from "@/lib/listings";
import type { SessionUser } from "@/lib/session";
import type { FavoriteContext } from "@/lib/favorites";

/**
 * Données d'une fiche annonce (payload de getPropertyBySlug, non-null).
 * Partagé par le composant noyau ListingDetail et les deux verticales
 * (StayDetail / ImmoDetail) — type unique, jamais redéfini.
 */
export type ListingData = NonNullable<Awaited<ReturnType<typeof getPropertyBySlug>>>;

/** Contexte « visiteur » d'une fiche, résolu une fois au point d'entrée. */
export type ListingViewer = SessionUser | null;
export type ListingFavCtx = FavoriteContext | null;
