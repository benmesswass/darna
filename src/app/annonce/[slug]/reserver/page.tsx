import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { fr as frMeta } from "@/lib/i18n/fr";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { stayEnabled } from "@/lib/modes";
import { BookingPanel } from "@/components/booking/BookingPanel";
import { ActiveSection } from "@/components/layout/ActiveSection";
import { expandUnavailable } from "@/lib/availability";

export const metadata: Metadata = { title: frMeta.booking.titre };

export default async function ReserverPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ arrivee?: string; depart?: string; voyageurs?: string }>;
}) {
  const fr = await getT();
  const { slug } = await params;
  const sp = await searchParams;

  const property = await prisma.property.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      city: true,
      type: true,
      status: true,
      expiresAt: true,
      price: true,
      maxGuests: true,
      ownerId: true,
      // Disponibilités temps réel : nuits confirmées + holds en attente non
      // expirés + blocages hôte → affichées directement sur le calendrier.
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
      availabilities: { select: { startDate: true, endDate: true } },
    },
  });
  // Réservation = parcours séjour : 404 si le bien n'est pas un séjour ou si la
  // verticale Séjours est désactivée par config.
  if (!property || property.type !== "SEJOUR" || !stayEnabled()) notFound();
  if (property.status !== "ACTIVE" || property.expiresAt.getTime() < Date.now()) {
    redirect(`/annonce/${slug}`);
  }

  const user = await getSessionUser();

  // Un hôte ne peut pas réserver son propre logement : on l'explique d'emblée
  // plutôt que de laisser le formulaire échouer après affichage du prix.
  const isOwner = Boolean(user && user.id === property.ownerId);

  const maxGuests = property.maxGuests ?? 30;
  const voyageurs = Math.max(1, Math.min(maxGuests, Number(sp.voyageurs) || 1));

  const unavailable = expandUnavailable([
    ...property.bookings.map((b) => ({ start: b.checkIn, end: b.checkOut })),
    ...property.availabilities.map((a) => ({ start: a.startDate, end: a.endDate })),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Réservation = parcours séjours : on garde la nav en surbrillance. */}
      <ActiveSection name="sejours" />
      <h1 className="text-3xl font-bold text-darna">{fr.booking.titre}</h1>
      <p className="mt-1 text-ink/60">
        {property.title} — {property.city}
      </p>

      {isOwner ? (
        <div
          role="status"
          className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-darna/10"
        >
          <p className="text-lg font-bold text-darna">
            {fr.booking.proprietaireImpossible}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
            {fr.booking.proprietaireImpossibleAide}
          </p>
        </div>
      ) : (
        /* Calendrier interactif + récapitulatif live (prix calculés côté serveur) */
        <BookingPanel
          slug={property.slug}
          unavailable={unavailable}
          maxGuests={maxGuests}
          defaultArrivee={sp.arrivee ?? ""}
          defaultDepart={sp.depart ?? ""}
          defaultVoyageurs={voyageurs}
          isLoggedIn={Boolean(user)}
        />
      )}
    </div>
  );
}
