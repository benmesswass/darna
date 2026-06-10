import { redirect } from "next/navigation";
import { fr } from "@/lib/i18n/fr";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { PropertyCard } from "@/components/property/PropertyCard";

export default async function FavorisPage() {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      property: {
        include: { photos: { orderBy: { position: "asc" }, take: 1 } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-darna">{fr.dashboard.favoris}</h2>
      {favorites.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-white p-8 text-center text-sm text-ink/60 ring-1 ring-darna/10">
          {fr.dashboard.aucunFavori}
        </p>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.map((f) => (
            <PropertyCard key={f.id} property={f.property} showType />
          ))}
        </div>
      )}
    </div>
  );
}
