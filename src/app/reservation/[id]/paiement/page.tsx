import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { stayEnabled } from "@/lib/modes";
import { settleKonnectBooking } from "@/lib/payments";
import { isKonnectEnabled } from "@/lib/konnect";
import { getRevealedContacts } from "@/lib/contact-reveal";
import { cancellationSchedule } from "@/lib/cancellation";
import { DepositPayment } from "@/components/booking/DepositPayment";
import { ContactReveal } from "@/components/booking/ContactReveal";
import { HoldCountdown } from "@/components/booking/HoldCountdown";
import { ActiveSection } from "@/components/layout/ActiveSection";
import { formatDateFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { CheckIcon, CloseIcon, ShieldIcon } from "@/components/icons";
import { SuccessCheck } from "@/components/ui/SuccessCheck";
import type { CancelPolicy } from "@/lib/constants";

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

  // Sélection unique partagée par la lecture initiale et la relecture post-settle
  // (évite toute dérive de forme entre les deux requêtes).
  const bookingSelect = {
    id: true,
    guestId: true,
    status: true,
    paymentMode: true,
    guests: true,
    checkIn: true,
    checkOut: true,
    serviceFee: true,
    totalPrice: true,
    depositAmount: true,
    amountPaid: true,
    expiresAt: true,
    property: {
      select: {
        title: true,
        city: true,
        slug: true,
        verified: true,
        verificationLevel: true,
        cancelPolicy: true,
      },
    },
  } as const;

  let booking = await prisma.booking.findUnique({
    where: { id },
    select: bookingSelect,
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
      select: bookingSelect,
    });
    if (!booking) notFound();
  }

  const confirmed =
    booking.status === "CONFIRMEE" || booking.status === "TERMINEE";
  // Rail 2 (PSP3) : demande cash en attente d'acceptation par l'hôte — état
  // distinct, ni "confirmé" ni "en attente de paiement" (il n'y a pas de
  // paiement à effectuer sur cette page dans ce mode).
  const pendingAcceptance = booking.status === "EN_ATTENTE_ACCEPTATION";
  // Rail 2 confirmé : "paiement protégé" est FAUX ici (rien ne transite par
  // Darna) — cf. retour de test du 2026-07-05, texte dédié requis.
  const isCashBooking = booking.paymentMode === "SUR_PLACE";

  // Coordonnées de l'hôte révélées au voyageur — UNIQUEMENT après confirmation,
  // via le gating serveur (jamais exposées dans les props avant l'acompte).
  const contacts = confirmed
    ? await getRevealedContacts(booking.id, user.id)
    : null;

  // Vérification terrain (Wakil) : argument de confiance majeur face au « zéro
  // contact » avant paiement.
  const isWakilVerified = booking.property.verificationLevel === "ON_SITE";
  const balanceDue = booking.totalPrice - booking.amountPaid;

  // Politique d'annulation traduite en DATES précises (paliers de remboursement
  // calculés depuis le check-in), comme chez les concurrents.
  const cancelPolicy = booking.property.cancelPolicy as CancelPolicy;
  const refundSchedule = cancellationSchedule(cancelPolicy, booking.checkIn);
  const lastTierDate = refundSchedule[refundSchedule.length - 1].until;

  const Recap = () => (
    <dl className="mt-5 space-y-2.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-body/70">{booking!.property.title}</dt>
        <dd className="text-body/70">{booking!.property.city}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-body/70">
          {fr.booking.sejourDates(
            formatDateFr(booking!.checkIn),
            formatDateFr(booking!.checkOut)
          )}
        </dt>
        <dd className="text-body/70">{fr.property.capacite(booking!.guests)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-body/70">{fr.booking.sousTotal}</dt>
        <dd>
          <Price
            amount={booking!.totalPrice - booking!.serviceFee}
            className="font-semibold"
          />
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-body/70">{fr.booking.fraisService}</dt>
        <dd>
          <Price amount={booking!.serviceFee} className="font-semibold" />
        </dd>
      </div>
      <div className="flex justify-between border-t border-darna/10 pt-3">
        <dt className="text-base font-bold text-heading">{fr.booking.total}</dt>
        <dd>
          <Price
            amount={booking!.totalPrice}
            className="text-xl font-bold text-heading"
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
        <div className="rounded-3xl bg-surface p-8 text-center ring-1 ring-emerald-200">
          <SuccessCheck size={64} />
          <h1 className="mt-5 text-2xl font-bold text-heading">
            {fr.booking.paiementConfirme}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-body/70">
            {isCashBooking ? fr.booking.cashConfirmeeDetail : fr.booking.paiementConfirmeDetail}
          </p>
          <div className="mt-5 rounded-2xl bg-cream p-4 text-start text-sm">
            <p className="font-semibold text-body">{booking.property.title}</p>
            <p className="text-body/60">
              {fr.booking.sejourDates(
                formatDateFr(booking.checkIn),
                formatDateFr(booking.checkOut)
              )}
            </p>
            <dl className="mt-3 space-y-1.5">
              <div className="flex justify-between">
                <dt className="text-body/60">{fr.booking.totalSejour}</dt>
                <dd>
                  <Price amount={booking.totalPrice} className="font-semibold text-body" />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-semibold text-heading">{fr.booking.payerMaintenant}</dt>
                <dd>
                  <Price amount={booking.amountPaid} className="font-bold text-heading" />
                </dd>
              </div>
              {balanceDue > 0 ? (
                <div className="flex justify-between border-t border-darna/10 pt-1.5">
                  <dt className="text-body/60">{fr.booking.soldeArrivee}</dt>
                  <dd>
                    <Price amount={balanceDue} className="font-semibold text-body" />
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {/* Coordonnées de l'hôte — révélées une fois la fenêtre d'annulation
              gratuite passée, sinon verrouillées avec date de déblocage. */}
          <ContactReveal
            contacts={contacts}
            bookingId={booking.id}
            className="mt-5"
          />

          <Link
            href="/dashboard/reservations"
            className="mt-6 inline-block rounded-full bg-darna px-7 py-3 text-sm font-bold text-white hover:bg-darna-light"
          >
            {fr.booking.voirMesReservations}
          </Link>
        </div>
      ) : pendingAcceptance ? (
        <div className="rounded-3xl bg-surface p-8 text-center ring-1 ring-darna/10">
          <ShieldIcon width={40} height={40} className="mx-auto text-sand" />
          <h1 className="mt-4 text-2xl font-bold text-heading">
            {fr.booking.cashEnAttenteTitre}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-body/70">
            {fr.booking.cashEnAttenteDetail}
          </p>

          <Recap />

          <p className="mt-4 rounded-2xl bg-sand-light/50 px-4 py-3 text-start text-xs font-medium text-darna-dark">
            {fr.booking.cashRecapInfo(booking.totalPrice)}
          </p>

          {booking.expiresAt ? (
            <p className="mt-3 text-xs text-body/50">
              {fr.booking.cashEnAttenteExpire(formatDateFr(booking.expiresAt))}
            </p>
          ) : null}

          <Link
            href="/dashboard/reservations"
            className="mt-6 inline-block rounded-full bg-darna px-7 py-3 text-sm font-bold text-white hover:bg-darna-light"
          >
            {fr.booking.voirMesReservations}
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl bg-surface p-8 ring-1 ring-darna/10">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-heading">
            <ShieldIcon width={24} height={24} className="text-sand" />
            {fr.booking.paiementTitre}
          </h1>

          {/* Confiance (1) : badge vérification très visible — compense le
              « zéro contact » avant paiement. */}
          {booking.property.verified ? (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
              <ShieldIcon width={14} height={14} />
              {isWakilVerified ? fr.booking.verifieWakil : fr.badges.verifie}
            </p>
          ) : null}

          <div className="mt-4 rounded-2xl bg-darna p-5 text-sm leading-relaxed text-white">
            <p className="font-semibold text-sand">{fr.brand.heroLine3}</p>
            <p className="mt-1.5 text-white/85">
              {fr.booking.sequestreExplication}
            </p>
          </div>

          {/* Confiance (2) : séquestre + révélation des coordonnées à la
              confirmation — explique pourquoi aucun contact n'est partagé avant. */}
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-sand-light/50 px-4 py-3 text-xs font-medium text-darna-dark">
            <ShieldIcon width={16} height={16} className="mt-0.5 shrink-0" />
            {fr.booking.acompteSequestreInfo}
          </p>

          <Recap />

          {/* Compte à rebours du hold (15 min) : rassure + crée l'urgence, et
              gère proprement l'expiration (dates libérées → relancer). */}
          {booking.expiresAt ? (
            <HoldCountdown
              expiresAt={booking.expiresAt.toISOString()}
              slug={booking.property.slug}
            />
          ) : null}

          {konnectEnabled && konnect === "fail" ? (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
            >
              {fr.booking.paiementEchoue}
            </p>
          ) : konnectEnabled && konnect === "success" ? (
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

          {/* Politique d'annulation de l'annonce — affichée AU MOMENT de payer :
              le voyageur sait ce qui est remboursable avant de s'engager. La
              part remboursable se calcule sur (payé − commission). */}
          <div className="mt-5 rounded-2xl bg-cream p-4 text-start text-sm">
            <p className="font-semibold text-body">
              {fr.property.politiqueAnnulation} :{" "}
              <span className="text-heading">
                {fr.property.cancelPolicy[cancelPolicy] ?? cancelPolicy}
              </span>
            </p>
            <ul className="mt-2 space-y-1 text-xs text-body/70">
              {refundSchedule.map((tier) => (
                <li key={tier.rate} className="flex items-start gap-1.5">
                  <CheckIcon
                    width={13}
                    height={13}
                    strokeWidth={3}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  {tier.rate === 1
                    ? fr.booking.annulationGratuiteJusqu(formatDateFr(tier.until))
                    : fr.booking.annulationRembJusqu(
                        tier.rate * 100,
                        formatDateFr(tier.until)
                      )}
                </li>
              ))}
              <li className="flex items-start gap-1.5 font-semibold text-red-600">
                <CloseIcon
                  width={13}
                  height={13}
                  strokeWidth={3}
                  className="mt-0.5 shrink-0"
                />
                {fr.booking.annulationNonRembApres(formatDateFr(lastTierDate))}
              </li>
            </ul>
          </div>

          {/* Choix du montant à régler maintenant (acompte → total) + paiement.
              Le serveur reborne toujours dans [acompte, total]. */}
          <DepositPayment
            bookingId={booking.id}
            totalPrice={booking.totalPrice}
            serviceFee={booking.serviceFee}
            depositAmount={booking.depositAmount}
            konnectEnabled={konnectEnabled}
          />
        </div>
      )}
    </div>
  );
}
