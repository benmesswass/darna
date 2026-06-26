import { notFound, redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { PropertyForm } from "@/components/dashboard/PropertyForm";
import { PhotoManager } from "@/components/dashboard/PhotoManager";
import { BlockedDatesManager } from "@/components/dashboard/BlockedDatesManager";
import { expandUnavailable, expandNotes } from "@/lib/availability";

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
    include: {
      photos: { orderBy: { position: "asc" } },
      // Capacité séjour depuis la table satellite (M2) pour préremplir le form.
      stay: { select: { maxGuests: true } },
      // Blocages en cours (on masque ceux entièrement passés).
      availabilities: {
        where: { endDate: { gt: new Date() } },
        orderBy: { startDate: "asc" },
      },
      // Réservations actives : grisées au calendrier de blocage (non bloquables).
      bookings: {
        where: {
          checkOut: { gte: new Date() },
          OR: [
            { status: "CONFIRMEE" },
            { status: "EN_ATTENTE", expiresAt: { gt: new Date() } },
          ],
        },
        select: { checkIn: true, checkOut: true },
      },
    },
  });
  if (!property) notFound();

  // Dates déjà prises (réservations actives) ou déjà bloquées → non
  // re-sélectionnables dans le calendrier de blocage.
  const unavailable = expandUnavailable([
    ...property.bookings.map((b) => ({ start: b.checkIn, end: b.checkOut })),
    ...property.availabilities.map((a) => ({ start: a.startDate, end: a.endDate })),
  ]);

  // Note privée par jour bloqué → tooltip au survol (côté hôte uniquement).
  const blockNotes = expandNotes(
    property.availabilities.map((a) => ({
      start: a.startDate,
      end: a.endDate,
      reason: a.reason,
    }))
  );

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
              maxGuests: property.stay?.maxGuests ?? null,
              latitude: property.latitude,
              longitude: property.longitude,
              description: property.description,
              amenities: property.amenities ? property.amenities.split("|") : [],
              cancelPolicy: property.cancelPolicy,
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

      {/* Blocage de dates : pertinent uniquement pour les séjours réservables. */}
      {property.type === "SEJOUR" ? (
        <div>
          <h2 className="text-xl font-bold text-darna">
            {fr.annonceForm.disponibilitesTitre}
          </h2>
          <div className="mt-5 rounded-3xl bg-white p-6 ring-1 ring-darna/10">
            <BlockedDatesManager
              propertyId={property.id}
              unavailable={unavailable}
              notes={blockNotes}
              blocks={property.availabilities.map((a) => ({
                id: a.id,
                start: a.startDate.toISOString().slice(0, 10),
                end: a.endDate.toISOString().slice(0, 10), // exclusif (arrivée → départ)
                reason: a.reason,
              }))}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
