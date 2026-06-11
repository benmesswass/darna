import { notFound, redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { PropertyForm } from "@/components/dashboard/PropertyForm";
import { PhotoManager } from "@/components/dashboard/PhotoManager";

export default async function ModifierAnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const { id } = await params;
  // Autorisation : l'annonce doit appartenir à l'utilisateur connecté.
  const property = await prisma.property.findFirst({
    where: { id, ownerId: user.id },
    include: { photos: { orderBy: { position: "asc" } } },
  });
  if (!property) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-darna">
          {fr.annonceForm.modifierTitre}
        </h2>
        <div className="mt-5 rounded-3xl bg-white p-6 ring-1 ring-darna/10">
          <PropertyForm
            initial={{
              id: property.id,
              title: property.title,
              type: property.type,
              price: property.price,
              city: property.city,
              address: property.address ?? "",
              surface: property.surface,
              rooms: property.rooms,
              maxGuests: property.maxGuests,
              latitude: property.latitude,
              longitude: property.longitude,
              description: property.description,
              amenities: property.amenities ? property.amenities.split("|") : [],
            }}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-darna">{fr.annonceForm.photosTitre}</h2>
        <div className="mt-5 rounded-3xl bg-white p-6 ring-1 ring-darna/10">
          <PhotoManager
            propertyId={property.id}
            photos={property.photos.map((p) => ({
              id: p.id,
              url: p.url,
              alt: p.alt,
              caption: p.caption,
              position: p.position,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
