import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { stayEnabled } from "@/lib/modes";
import { confirmPaymentAction } from "@/actions/bookings";
import { settleKonnectBooking } from "@/lib/payments";
import { isKonnectEnabled } from "@/lib/konnect";
import { KonnectPayButton } from "@/components/booking/KonnectPayButton";
import { ActiveSection } from "@/components/layout/ActiveSection";
import { formatDateFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { CheckIcon, CoinsIcon, ShieldIcon } from "@/components/icons";

export const metadata: Metadata = { title: frMeta.booking.paiementTitre };

export default async function PaiementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ konnect?: string }>;
}) {
  const fr = await getT();
  const { id } = await params;
  const { konnect } = await searchParams;
  // Paiement = parcours séjour : 404 si la verticale Séjours est désactivée.
  if (!stayEnabled()) notFound();

  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const konnectEnabled = isKonnectEnabled();

  let booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      guestId: true,
      status: true,
      guests: true,
      checkIn: true,
      checkOut: true,
      serviceFee: true,
      totalPrice: true,
      property: { select: { title: true, city: true } },
    },
  });
  // Autorisation : la réservation appartient au voyageur connecté.
  if (!booking || booking.guestId !== user.id) notFound();

  // Retour de la passerelle Konnect : on règle (idempotent) avant l'affichage,
  // puis on relit le statut. Filet de sécurité si le webhook n'a pas (encore)
  // abouti — indispensable en dev local où Konnect ne joint pas localhost.
  if (konnectEnabled && konnect === "success" && booking.status === "EN_ATTENTE") {
    await settleKonnectBooking({ bookingId: id });
    booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        guestId: true,
        status: true,
        guests: true,
        checkIn: true,
        checkOut: true,
        serviceFee: true,
        totalPrice: true,
        property: { select: { title: true, city: true } },
      },
    });
    if (!booking) notFound();
  }

  const confirmed =
    booking.status === "CONFIRMEE" || booking.status === "TERMINEE";

  const Recap = () => (
    <dl className="mt-5 space-y-2.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-ink/70">{booking!.property.title}</dt>
        <dd className="text-ink/70">{booking!.property.city}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-ink/70">
          {fr.booking.sejourDates(
            formatDateFr(booking!.checkIn),
            formatDateFr(booking!.checkOut)
          )}
        </dt>
        <dd className="text-ink/70">{fr.property.capacite(booking!.guests)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-ink/70">{fr.booking.sousTotal}</dt>
        <dd>
          <Price
            amount={booking!.totalPrice - booking!.serviceFee}
            className="font-semibold"
          />
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-ink/70">{fr.booking.fraisService}</dt>
        <dd>
          <Price amount={booking!.serviceFee} className="font-semibold" />
        </dd>
      </div>
      <div className="flex justify-between border-t border-darna/10 pt-3">
        <dt className="text-base font-bold text-darna">{fr.booking.total}</dt>
        <dd>
          <Price
            amount={booking!.totalPrice}
            className="text-xl font-bold text-darna"
          />
        </dd>
      </div>
    </dl>
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      {/* Paiement = parcours séjours : on garde la nav en surbrillance. */}
      <ActiveSection name="sejours" />
      {confirmed ? (
        <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-emerald-200">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white">
            <CheckIcon width={32} height={32} strokeWidth={2.5} />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-darna">
            {fr.booking.paiementConfirme}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink/70">
            {fr.booking.paiementConfirmeDetail}
          </p>
          <div className="mt-5 rounded-2xl bg-cream p-4 text-sm">
            <p className="font-semibold text-ink">{booking.property.title}</p>
            <p className="text-ink/60">
              {fr.booking.sejourDates(
                formatDateFr(booking.checkIn),
                formatDateFr(booking.checkOut)
              )}
            </p>
            <Price
              amount={booking.totalPrice}
              className="mt-1 block text-lg font-bold text-darna"
            />
          </div>
          <Link
            href="/dashboard/reservations"
            className="mt-6 inline-block rounded-full bg-darna px-7 py-3 text-sm font-bold text-white hover:bg-darna-light"
          >
            {fr.booking.voirMesReservations}
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-8 ring-1 ring-darna/10">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-darna">
            <ShieldIcon width={24} height={24} className="text-sand" />
            {fr.booking.paiementTitre}
          </h1>

          <div className="mt-5 rounded-2xl bg-darna p-5 text-sm leading-relaxed text-white">
            <p className="font-semibold text-sand">{fr.brand.heroLine3}</p>
            <p className="mt-1.5 text-white/85">
              {fr.booking.sequestreExplication}
            </p>
          </div>

          <Recap />

          {konnectEnabled ? (
            <>
              {konnect === "fail" ? (
                <p
                  role="alert"
                  className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
                >
                  {fr.booking.paiementEchoue}
                </p>
              ) : konnect === "success" ? (
                <p className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-sand-light/50 px-4 py-2.5 text-sm font-medium text-darna-dark">
                  {fr.booking.paiementEnVerification}
                  <Link
                    href={`/reservation/${booking.id}/paiement`}
                    className="shrink-0 font-bold underline"
                  >
                    {fr.booking.actualiser}
                  </Link>
                </p>
              ) : null}

              <p className="mt-5 flex items-start gap-2 rounded-xl bg-cream px-4 py-3 text-xs font-medium text-darna-dark">
                <CoinsIcon width={16} height={16} className="mt-0.5 shrink-0" />
                {fr.booking.paiementKonnectInfo}
              </p>

              <KonnectPayButton bookingId={booking.id} />
            </>
          ) : (
            <>
              <p className="mt-5 flex items-start gap-2 rounded-xl bg-sand-light/50 px-4 py-3 text-xs font-medium text-darna-dark">
                <CoinsIcon width={16} height={16} className="mt-0.5 shrink-0" />
                {fr.booking.paiementMockInfo}
              </p>

              <form action={confirmPaymentAction} className="mt-5">
                <input type="hidden" name="bookingId" value={booking.id} />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-sand px-6 py-3.5 text-base font-bold text-darna-dark transition hover:bg-sand-light"
                >
                  {fr.booking.payerSimulation}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
