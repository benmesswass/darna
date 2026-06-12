import { prisma } from "@/lib/prisma";

export type FavoriteFolderLite = { id: string; name: string };

/**
 * Contexte favoris d'un utilisateur, chargé UNE fois par requête puis distribué
 * aux PropertyCard d'une page (évite une requête par vignette) :
 *  - `folders` : ses dossiers (du plus récent au plus ancien), pour le sélecteur.
 *  - `favoritedIds` : set des propertyId déjà enregistrés, pour l'état du cœur.
 *
 * Renvoie null pour un visiteur non connecté → aucune card n'affiche le cœur.
 */
export type FavoriteContext = {
  folders: FavoriteFolderLite[];
  favoritedIds: Set<string>;
};

export async function getFavoriteContext(
  userId: string | null | undefined
): Promise<FavoriteContext | null> {
  if (!userId) return null;

  const [folders, favorites] = await Promise.all([
    prisma.favoriteFolder.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favorite.findMany({
      where: { userId },
      select: { propertyId: true },
    }),
  ]);

  return {
    folders,
    favoritedIds: new Set(favorites.map((f) => f.propertyId)),
  };
}

/** Prop favori passée à une PropertyCard (cœur masqué si visiteur non connecté). */
export type FavoriteCardProp = {
  isFavorited: boolean;
  folders: FavoriteFolderLite[];
  // Date d'arrivée de la recherche en cours (YYYY-MM-DD) : sert à pré-remplir
  // le nom du nouveau dossier avec le mois RECHERCHÉ (« Ville, Août 2026 »),
  // pas le mois courant. Absente → on retombe sur le mois courant.
  defaultDate?: string;
};

/**
 * Construit la prop `favorite` d'une card à partir du contexte chargé en tête
 * de page. Renvoie undefined pour un visiteur non connecté → pas de cœur.
 * `defaultDate` (date d'arrivée recherchée) est propagée jusqu'au sélecteur.
 */
export function favoritePropFor(
  ctx: FavoriteContext | null,
  propertyId: string,
  defaultDate?: string
): FavoriteCardProp | undefined {
  if (!ctx) return undefined;
  return {
    isFavorited: ctx.favoritedIds.has(propertyId),
    folders: ctx.folders,
    defaultDate,
  };
}
