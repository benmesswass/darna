import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { completeElapsedBookings } from "@/lib/bookings";
import { formatDateShortFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { computeBookingRefund } from "@/lib/cancellation";
import { contactRevealState, type ContactGate } from "@/lib/contact-reveal";
import type { CancelPolicy } from "@/lib/constants";
import { CancelBookingButton } from "@/components/booking/CancelBookingButton";
import { NoShowButton } from "@/components/booking/NoShowButton";
import { ContactReveal } from "@/components/booking/ContactReveal";
import { GuestReviewForm } from "@/components/booking/GuestReviewForm";
import { GuestReviewDisplay } from "@/components/booking/GuestReviewDisplay";

const STATUS_STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  EN_ATTENTE_ACCEPTATION: "bg-sky-100 text-sky-800",
  CONFIRMEE: "bg-emerald-100 text-emerald-800",
  ANNULEE: "bg-red-100 text-red-700",
  TERMINEE: "bg-darna/10 text-heading",
};

const DAY = 1000 * 60 * 60 * 24;
const nightsBetween = (checkIn: Date, checkOut: Date) =>
  Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / DAY));

/**
 * Libellé de statut affiché — DISTINCT pour une réservation Rail 2 confirmée
 * (paymentMode SUR_PLACE) : "Confirmée — paiement protégé" / "Payé le" sont
 * FAUX dans ce cas (rien ne transite par Darna, tout se règle cash à
 * l'arrivée). Cf. retour de test du 2026-07-05.
 */
function bookingStatusLabel(
  status: string,
  paymentMode: string,
  fr: Awaited<ReturnType<typeof getT>>
): string {
  if (status === "CONFIRMEE" && paymentMode === "SUR_PLACE") {
    return fr.dashboard.confirmeeCashLabel;
  }
  return fr.dashboard.statutReservation[status] ?? status;
}

export default async function MesReservationsPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  // Complétion paresseuse : séjours terminés → TERMINEE + séquestre libéré.
  await completeElapsedBookings();

  // Côté hôte / agence : « Mes réservations » = les réservations REÇUES sur ses
  // annonces (qui a réservé chez lui), pas ses propres réservations de voyageur.
  if (user.role === "HOTE" || user.role === "AGENCE") {
    const bookings = await prisma.booking.findMany({
      where: {
        property: { ownerId: user.id },
        status: { not: "ANNULEE" },
        // Les demandes cash (Rail 2, EN_ATTENTE_ACCEPTATION) vivent dans
        // « Demandes reçues », pas ici — cf. retour de test du 2026-07-06 :
        // "Mes voyageurs" ne garde que les séjours confirmés/en cours/passés.
        // On masque aussi les EN_ATTENTE (paiement) déjà expirées.
        NOT: [
          { status: "EN_ATTENTE_ACCEPTATION" },
          { status: "EN_ATTENTE", expiresAt: { lt: new Date() } },
        ],
      },
      include: {
        property: {
          select: {
            slug: true,
            title: true,
            city: true,
            cancelPolicy: true,
            photos: { orderBy: { position: "asc" }, take: 1 },
          },
        },
        guest: { select: { name: true, email: true, phone: true } },
        guestReview: { select: { rating: true, comment: true } },
      },
      orderBy: { checkIn: "desc" },
    });

    type HostBookingRow = (typeof bookings)[number];

    function HostBookingCard({ b }: { b: HostBookingRow }) {
      return (
        <li className="flex flex-col gap-4 rounded-3xl bg-surface p-4 ring-1 ring-darna/10 sm:flex-row">
          <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-2xl sm:w-36">
            {b.property.photos[0] ? (
              <Image
                src={b.property.photos[0].url}
                alt={b.property.title}
                fill
                sizes="144px"
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[b.status] ?? "bg-cream text-body"}`}
              >
                {bookingStatusLabel(b.status, b.paymentMode, fr)}
              </span>
              {b.paidAt ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  ✓{" "}
                  {b.paymentMode === "SUR_PLACE"
                    ? fr.dashboard.confirmeeLe(formatDateShortFr(b.paidAt))
                    : fr.dashboard.payeLe(formatDateShortFr(b.paidAt))}
                </span>
              ) : null}
            </div>

            <Link
              href={`/annonce/${b.property.slug}`}
              className="mt-1.5 block truncate font-semibold text-body hover:text-heading"
            >
              {b.property.title}
            </Link>
            <p className="text-sm text-body/60">
              {b.property.city} ·{" "}
              {fr.booking.sejourDates(
                formatDateShortFr(b.checkIn),
                formatDateShortFr(b.checkOut)
              )}{" "}
              · {fr.booking.nuits(nightsBetween(b.checkIn, b.checkOut))} ·{" "}
              {fr.property.capacite(b.guests)}
            </p>

            {/* Gating anti-bypass : coordonnées du voyageur révélées
                seulement une fois la fenêtre d'annulation gratuite passée
                (sinon verrouillées avec date de déblocage). */}
            {(() => {
              const reveal = contactRevealState(
                b.status,
                b.checkIn,
                b.property.cancelPolicy as CancelPolicy
              );
              const gate: ContactGate =
                reveal.state === "revealed"
                  ? { state: "revealed", viewer: "host", counterpart: b.guest }
                  : reveal.state === "locked"
                    ? { state: "locked", viewer: "host", revealAt: reveal.revealAt }
                    : null;
              return (
                <ContactReveal
                  contacts={gate}
                  bookingId={b.id}
                  className="mt-2"
                />
              );
            })()}
            {b.status === "CONFIRMEE" || b.status === "TERMINEE" ? (
              <Link
                href={`/reservation/${b.id}/messages`}
                className="mt-2 inline-block text-xs font-bold text-heading underline"
              >
                {fr.messages.lien} →
              </Link>
            ) : null}

            {/* Avis hôte → voyageur (F1) : possible seulement une fois le
                séjour passé, une seule fois par réservation. */}
            {b.guestReview ? (
              <GuestReviewDisplay
                rating={b.guestReview.rating}
                comment={b.guestReview.comment}
                label={fr.dashboard.votreAvisSurCeVoyageur}
                className="mt-2"
              />
            ) : (b.status === "CONFIRMEE" || b.status === "TERMINEE") &&
              b.checkOut.getTime() < Date.now() ? (
              <GuestReviewForm bookingId={b.id} />
            ) : null}

            <p className="mt-1.5 text-sm">
              <Price amount={b.totalPrice} className="font-bold text-heading" />
            </p>

            {/* Rail 2 : signalement no-show, uniquement une fois le
                check-in passé sur une réservation cash confirmée. */}
            {b.status === "CONFIRMEE" &&
            b.paymentMode === "SUR_PLACE" &&
            b.checkIn.getTime() < Date.now() ? (
              <div className="mt-3">
                <NoShowButton bookingId={b.id} />
              </div>
            ) : null}
          </div>
        </li>
      );
    }

    return (
      <div>
        <h2 className="text-xl font-bold text-heading">{fr.dashboard.mesReservations}</h2>

        {bookings.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-surface p-10 text-center ring-1 ring-darna/10">
            <p className="text-lg font-semibold text-heading">
              {fr.dashboard.aucuneReservationHote}
            </p>
            <p className="mt-1 text-sm text-body/60">
              {fr.dashboard.aucuneReservationHoteCta}
            </p>
            <Link
              href="/dashboard/annonces"
              className="mt-5 inline-block rounded-full bg-darna px-6 py-2.5 text-sm font-semibold text-white hover:bg-darna-light"
            >
              {fr.dashboard.mesAnnonces}
            </Link>
          </div>
        ) : (
          <ul className="mt-5 space-y-4">
            {bookings.map((b) => (
              <HostBookingCard key={b.id} b={b} />
            ))}
          </ul>
        )}
      </div>
    );
  }

  // ── Voyageur : ses propres réservations ──────────────────────────────────
  const bookings = await prisma.booking.findMany({
    where: { guestId: user.id },
    include: {
      property: {
        select: {
          slug: true,
          title: true,
          city: true,
          cancelPolicy: true,
          photos: { orderBy: { position: "asc" }, take: 1 },
          // Coordonnées de l'hôte : récupérées ici mais RENDUES uniquement pour
          // les réservations confirmées (gating anti-bypass ci-dessous).
          owner: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      review: { select: { id: true } },
      guestReview: { select: { rating: true, comment: true } },
    },
    orderBy: { checkIn: "desc" },
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-heading">{fr.dashboard.mesReservations}</h2>

      {bookings.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-surface p-10 text-center ring-1 ring-darna/10">
          <p className="text-lg font-semibold text-heading">
            {fr.dashboard.aucuneReservation}
          </p>
          <p className="mt-1 text-sm text-body/60">{fr.dashboard.aucuneReservationCta}</p>
          <Link
            href="/sejours"
            className="mt-5 inline-block rounded-full bg-darna px-6 py-2.5 text-sm font-semibold text-white hover:bg-darna-light"
          >
            {fr.brand.ctaSejours}
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex flex-col gap-4 rounded-3xl bg-surface p-4 ring-1 ring-darna/10 sm:flex-row sm:items-center"
            >
              <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-2xl sm:w-36">
                {b.property.photos[0] ? (
                  <Image
                    src={b.property.photos[0].url}
                    alt={b.property.title}
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[b.status] ?? "bg-cream text-body"}`}
                >
                  {bookingStatusLabel(b.status, b.paymentMode, fr)}
                </span>
                <p className="mt-1.5 truncate font-semibold text-body">
                  {b.property.title}
                </p>
                <p className="text-sm text-body/60">
                  {b.property.city} ·{" "}
                  {fr.booking.sejourDates(
                    formatDateShortFr(b.checkIn),
                    formatDateShortFr(b.checkOut)
                  )}
                </p>
                <p className="mt-0.5 text-sm">
                  <Price amount={b.totalPrice} className="font-bold text-heading" />
                </p>
                {/* Coordonnées de l'hôte — révélées au voyageur une fois la
                    fenêtre d'annulation gratuite passée (sinon verrouillées). */}
                {(() => {
                  const reveal = contactRevealState(
                    b.status,
                    b.checkIn,
                    b.property.cancelPolicy as CancelPolicy
                  );
                  const gate: ContactGate =
                    reveal.state === "revealed"
                      ? { state: "revealed", viewer: "guest", counterpart: b.property.owner }
                      : reveal.state === "locked"
                        ? { state: "locked", viewer: "guest", revealAt: reveal.revealAt }
                        : null;
                  return (
                    <ContactReveal
                      contacts={gate}
                      bookingId={b.id}
                      className="mt-3"
                    />
                  );
                })()}
                {/* Avis reçu de l'hôte (F1, avis bidirectionnels) — visible dès
                    que l'hôte l'a publié. */}
                {b.guestReview ? (
                  <GuestReviewDisplay
                    rating={b.guestReview.rating}
                    comment={b.guestReview.comment}
                    label={fr.dashboard.avisHoteSurVous}
                    className="mt-3"
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/annonce/${b.property.slug}`}
                  className="rounded-xl border border-darna/15 px-3.5 py-2 text-center text-xs font-semibold text-heading hover:bg-darna/5"
                >
                  {fr.dashboard.voirAnnonce}
                </Link>
                {b.status === "EN_ATTENTE" ? (
                  <Link
                    href={`/reservation/${b.id}/paiement`}
                    className="rounded-xl bg-sand px-3.5 py-2 text-center text-xs font-bold text-darna-dark hover:bg-sand-light"
                  >
                    {fr.booking.continuerPaiement}
                  </Link>
                ) : null}
                {b.status === "EN_ATTENTE_ACCEPTATION" ? (
                  <Link
                    href={`/reservation/${b.id}/paiement`}
                    className="rounded-xl bg-sand px-3.5 py-2 text-center text-xs font-bold text-darna-dark hover:bg-sand-light"
                  >
                    {fr.dashboard.statutReservation.EN_ATTENTE_ACCEPTATION}
                  </Link>
                ) : null}
                {b.status === "CONFIRMEE" || b.status === "TERMINEE" ? (
                  <Link
                    href={`/reservation/${b.id}/messages`}
                    className="rounded-xl border border-darna/15 px-3.5 py-2 text-center text-xs font-semibold text-heading hover:bg-darna/5"
                  >
                    {fr.messages.lien}
                  </Link>
                ) : null}
                {/* Fiche hôte publique : gatée sur EXACTEMENT la même condition
                    que le déverrouillage des coordonnées (contactRevealState),
                    pas seulement le statut — sinon le nom de l'hôte serait
                    visible via le profil avant même que les coordonnées ne se
                    débloquent, contradiction relevée en test le 2026-07-05
                    (auparavant gatée sur status seul, incohérent avec
                    l'anti-contournement de ListingDetail). */}
                {contactRevealState(
                  b.status,
                  b.checkIn,
                  b.property.cancelPolicy as CancelPolicy
                ).state === "revealed" ? (
                  <Link
                    href={`/hote/${b.property.owner.id}`}
                    className="rounded-xl border border-darna/15 px-3.5 py-2 text-center text-xs font-semibold text-heading hover:bg-darna/5"
                  >
                    {fr.dashboard.voirProfilHote}
                  </Link>
                ) : null}
                {b.status === "CONFIRMEE" ? (
                  <CancelBookingButton
                    bookingId={b.id}
                    refundAmount={
                      computeBookingRefund(
                        b.amountPaid,
                        b.serviceFee,
                        b.checkIn,
                        b.property.cancelPolicy as CancelPolicy,
                        b.createdAt
                      ).refundAmount
                    }
                  />
                ) : null}
                {b.status === "ANNULEE" && b.cancelledAt ? (
                  <div className="space-y-0.5 text-[11px] text-body/50">
                    <p>{fr.dashboard.cancelledAt(formatDateShortFr(b.cancelledAt))}</p>
                    {b.refundAmount != null && b.refundAmount > 0 ? (
                      <p className="font-semibold text-emerald-700">
                        {fr.dashboard.rembourseLabel(b.refundAmount)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
