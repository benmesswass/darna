import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { fr as frMeta } from "@/lib/i18n/fr";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { BookingPanel } from "@/components/booking/BookingPanel";
import { ActiveSection } from "@/components/layout/ActiveSection";

export const metadata: Metadata = { title: frMeta.booking.titre };

const DAY = 24 * 60 * 60 * 1000;

/**
 * Étale les plages réservées/bloquées en nuits civiles (YYYY-MM-DD), bornées à
 * [aujourd'hui, horizon]. Les dates en base sont stockées à minuit UTC : on
 * itère en UTC pour rester exact quel que soit le fuseau du serveur.
 */
function expandUnavailable(
  ranges: { start: Date; end: Date }[],
  horizonDays = 365
): string[] {
  const out = new Set<string>();
  const startOfTodayUtc = Date.parse(
    `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`
  );
  const horizon = startOfTodayUtc + horizonDays * DAY;
  for (const { start, end } of ranges) {
    let t = Math.max(start.getTime(), startOfTodayUtc);
    const endT = end.getTime();
    while (t < endT && t <= horizon) {
      out.add(new Date(t).toISOString().slice(0, 10));
      t += DAY;
    }
  }
  return [...out];
}

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
  if (!property || property.type !== "SEJOUR") notFound();
  if (property.status !== "ACTIVE" || property.expiresAt.getTime() < Date.now()) {
    redirect(`/annonce/${slug}`);
  }

  const user = await getSessionUser();

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

      {/* Calendrier interactif + récapitulatif live (prix calculés côté serveur) */}
      <BookingPanel
        slug={property.slug}
        unavailable={unavailable}
        maxGuests={maxGuests}
        defaultArrivee={sp.arrivee ?? ""}
        defaultDepart={sp.depart ?? ""}
        defaultVoyageurs={voyageurs}
        isLoggedIn={Boolean(user)}
      />
    </div>
  );
}
