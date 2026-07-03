import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { listingCardInclude } from "@/lib/listings";
import { PropertyCard } from "@/components/property/PropertyCard";
import { FolderHeader } from "@/components/dashboard/FolderHeader";
import { FolderIcon } from "@/components/icons";

export default async function FavorisPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const [folders, favorites] = await Promise.all([
    // Tous les dossiers — y compris vides — du plus récent au plus ancien.
    prisma.favoriteFolder.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      include: { property: { include: listingCardInclude } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Groupement : un seau par dossier + un seau « Sans dossier ».
  const byFolder = new Map<string, typeof favorites>();
  const noFolder: typeof favorites = [];
  for (const f of favorites) {
    if (f.folderId) {
      const bucket = byFolder.get(f.folderId);
      if (bucket) bucket.push(f);
      else byFolder.set(f.folderId, [f]);
    } else {
      noFolder.push(f);
    }
  }

  // Chaque card reçoit la liste complète des dossiers (pour le sélecteur) et
  // est marquée favorite → le clic sur le cœur retire le logement.
  const cardFavorite = { isFavorited: true, folders };

  const isEmpty = folders.length === 0 && favorites.length === 0;

  return (
    <div>
      <h2 className="text-xl font-bold text-heading">{fr.dashboard.favoris}</h2>

      {isEmpty ? (
        <p className="mt-6 rounded-3xl bg-surface p-8 text-center text-sm text-body/60 ring-1 ring-darna/10">
          {fr.dashboard.aucunFavori}
        </p>
      ) : (
        <div className="mt-6 space-y-10">
          {folders.map((folder) => {
            const items = byFolder.get(folder.id) ?? [];
            return (
              <section key={folder.id}>
                <FolderHeader
                  folderId={folder.id}
                  name={folder.name}
                  count={items.length}
                />
                {items.length > 0 ? (
                  <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((f) => (
                      <PropertyCard
                        key={f.id}
                        property={f.property}
                        showType
                        favorite={cardFavorite}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}

          {noFolder.length > 0 ? (
            <section>
              <div className="flex items-center gap-2">
                <FolderIcon width={18} height={18} className="shrink-0 text-body/40" />
                <h3 className="font-semibold text-body/70">
                  {fr.dashboard.favorisSansDossier}
                </h3>
                <span className="text-sm text-body/50">
                  {fr.dashboard.favorisNbLogements(noFolder.length)}
                </span>
              </div>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {noFolder.map((f) => (
                  <PropertyCard
                    key={f.id}
                    property={f.property}
                    showType
                    favorite={cardFavorite}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
