import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fr } from "@/lib/i18n/fr";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { SERVICE_FEE_RATE } from "@/lib/config";
import { formatDateFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { BookingSubmit } from "@/components/booking/BookingSubmit";
import { CalendarIcon, ShieldIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = { title: fr.booking.titre };

const DAY = 24 * 60 * 60 * 1000;

function parseDate(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default async function ReserverPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ arrivee?: string; depart?: string; voyageurs?: string }>;
}) {
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-darna">{fr.booking.titre}</h1>
      <p className="mt-1 text-ink/60">
        {property.title} — {property.city}
      </p>

      {/* Choix des dates */}
      <form
        method="GET"
        className="mt-6 grid gap-3 rounded-3xl bg-white p-5 ring-1 ring-darna/10 sm:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-ink/60">
            <CalendarIcon width={13} height={13} />
            {fr.search.arrivee}
          </span>
          <input
            type="date"
            name="arrivee"
            required
            defaultValue={sp.arrivee ?? ""}
            className="rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-ink/60">
            <CalendarIcon width={13} height={13} />
            {fr.search.depart}
          </span>
          <input
            type="date"
            name="depart"
            required
            defaultValue={sp.depart ?? ""}
            className="rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-ink/60">
            <UsersIcon width={13} height={13} />
            {fr.search.voyageurs}
          </span>
          <input
            type="number"
            name="voyageurs"
            min={1}
            max={property.maxGuests ?? 30}
            defaultValue={voyageurs}
            className="rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
          />
        </label>
        <button
          type="submit"
          className="self-end rounded-xl bg-darna px-5 py-2.5 text-sm font-semibold text-white hover:bg-darna-light"
        >
          {fr.common.rechercher}
        </button>
      </form>

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
