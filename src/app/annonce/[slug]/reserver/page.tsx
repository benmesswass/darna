import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { fr as frMeta } from "@/lib/i18n/fr";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { SERVICE_FEE_RATE } from "@/lib/config";
import { formatDateFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { BookingSubmit } from "@/components/booking/BookingSubmit";
import { BookingDatePicker } from "@/components/booking/BookingDatePicker";
import { ActiveSection } from "@/components/layout/ActiveSection";
import { ShieldIcon } from "@/components/icons";

export const metadata: Metadata = { title: frMeta.booking.titre };

const DAY = 24 * 60 * 60 * 1000;

function parseDate(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

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

  const arrivee = parseDate(sp.arrivee);
  const depart = parseDate(sp.depart);
  const voyageurs = Math.max(1, Math.min(30, Number(sp.voyageurs) || 1));
  const nights =
    arrivee && depart ? Math.round((depart.getTime() - arrivee.getTime()) / DAY) : 0;
  const validDates = Boolean(arrivee && depart && nights >= 1 && nights <= 90);

  const subtotal = validDates ? property.price * nights : 0;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee;

  const unavailable = expandUnavailable([
    ...property.bookings.map((b) => ({ start: b.checkIn, end: b.checkOut })),
    ...property.availabilities.map((a) => ({ start: a.startDate, end: a.endDate })),
  ]);
  const maxGuests = property.maxGuests ?? 30;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Réservation = parcours séjours : on garde la nav en surbrillance. */}
      <ActiveSection name="sejours" />
      <h1 className="text-3xl font-bold text-darna">{fr.booking.titre}</h1>
      <p className="mt-1 text-ink/60">
        {property.title} — {property.city}
      </p>

      {/* Choix des dates — calendrier interactif avec disponibilités en direct */}
      <BookingDatePicker
        unavailable={unavailable}
        maxGuests={maxGuests}
        defaultArrivee={sp.arrivee ?? ""}
        defaultDepart={sp.depart ?? ""}
        defaultVoyageurs={voyageurs}
      />

      {/* Récapitulatif 100 % transparent */}
      {validDates && arrivee && depart ? (
        <div className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-darna/10">
          <h2 className="text-lg font-bold text-darna">{fr.booking.recapitulatif}</h2>
          <p className="mt-1 text-sm text-ink/60">
            {fr.booking.sejourDates(formatDateFr(arrivee), formatDateFr(depart))} ·{" "}
            {fr.property.capacite(voyageurs)}
          </p>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink/70">
                {fr.booking.prixNuit} × {fr.booking.nuits(nights)}
              </dt>
              <dd>
                <Price amount={subtotal} className="font-semibold text-ink" />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink/70">
                {fr.booking.fraisService}
                <span className="block text-xs text-ink/40">
                  {fr.booking.fraisServiceAide}
                </span>
              </dt>
              <dd>
                <Price amount={serviceFee} className="font-semibold text-ink" />
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-darna/10 pt-3 text-base">
              <dt className="font-bold text-darna">{fr.booking.total}</dt>
              <dd>
                <Price amount={total} className="text-xl font-bold text-darna" />
              </dd>
            </div>
          </dl>

          <p className="mt-3 flex items-center gap-2 rounded-xl bg-cream px-4 py-2.5 text-xs font-medium text-darna-dark">
            <ShieldIcon width={15} height={15} />
            {fr.booking.aucunFraisCache}
          </p>

          {user ? (
            <BookingSubmit
              slug={property.slug}
              arrivee={sp.arrivee ?? ""}
              depart={sp.depart ?? ""}
              voyageurs={voyageurs}
            />
          ) : (
            <Link
              href="/connexion"
              className="mt-5 block rounded-2xl bg-darna px-6 py-3.5 text-center text-base font-bold text-white transition hover:bg-darna-light"
            >
              {fr.booking.connexionRequise}
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
