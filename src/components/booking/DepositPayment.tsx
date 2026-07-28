"use client";

import { confirmPaymentAction } from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";
import { Price } from "@/components/currency/Price";
import { KonnectPayButton } from "@/components/booking/KonnectPayButton";
import { CoinsIcon } from "@/components/icons";

/**
 * Récapitulatif de paiement — modèle commission-only (LANCEMENT_ROADMAP.md
 * §L5.1) : le montant réglé en ligne est FIXE (les frais de service Darna),
 * plus aucun choix voyageur (ancien curseur/raccourcis, cf. historique git).
 * Le loyer intégral se règle en espèces à l'hôte, à l'arrivée.
 *
 * Composant CLIENT : aucune coordonnée de l'hôte n'y transite (révélées
 * seulement après confirmation, cf. getRevealedContacts).
 */
export function DepositPayment({
  bookingId,
  totalPrice,
  depositAmount,
  konnectEnabled,
}: {
  bookingId: string;
  totalPrice: number;
  /** Frais de service Darna — seul montant réglé en ligne (== serviceFee). */
  depositAmount: number;
  konnectEnabled: boolean;
}) {
  const fr = useT();

  const balanceDue = totalPrice - depositAmount;

  return (
    <div className="mt-6">
      <h2 className="text-base font-bold text-heading">{fr.booking.montantAPayer}</h2>
      <p className="mt-1 text-xs leading-relaxed text-body/60">
        {fr.booking.montantAPayerAide}
      </p>

      {/* Récapitulatif du paiement */}
      <dl className="mt-5 space-y-2.5 rounded-2xl bg-cream p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-body/70">{fr.booking.totalSejour}</dt>
          <dd>
            <Price amount={totalPrice} className="font-semibold text-body" />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-semibold text-heading">{fr.booking.payerMaintenant}</dt>
          <dd>
            <Price amount={depositAmount} className="text-base font-bold text-heading" />
          </dd>
        </div>
        <div className="flex justify-between border-t border-darna/10 pt-2.5">
          <dt className="text-body/70">
            {fr.booking.soldeArrivee}
            <span className="block text-[11px] font-normal text-body/45">
              {fr.booking.soldeArriveeAide}
            </span>
          </dt>
          <dd>
            <Price amount={balanceDue} className="font-semibold text-body" />
          </dd>
        </div>
      </dl>

      {/* Règle de remboursement (frais non remboursables passé le délai gratuit) */}
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-sand-light/40 px-4 py-3 text-[11px] leading-relaxed font-medium text-darna-dark">
        <CoinsIcon width={15} height={15} className="mt-0.5 shrink-0" />
        {fr.booking.remboursementFraisPolitique}
      </p>

      {/* Paiement : montant fixe (les frais), plus aucune saisie voyageur. */}
      {konnectEnabled ? (
        <KonnectPayButton bookingId={bookingId} />
      ) : (
        <form action={confirmPaymentAction} className="mt-5">
          <input type="hidden" name="bookingId" value={bookingId} />
          <button
            type="submit"
            className="w-full rounded-2xl bg-sand px-6 py-3.5 text-base font-bold text-darna-dark transition hover:bg-sand-light"
          >
            {fr.booking.payerSimulation}
          </button>
        </form>
      )}
    </div>
  );
}
