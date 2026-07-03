"use client";

import { useState } from "react";
import { confirmPaymentAction } from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";
import { Price } from "@/components/currency/Price";
import { KonnectPayButton } from "@/components/booking/KonnectPayButton";
import { CoinsIcon } from "@/components/icons";

/**
 * Sélecteur du montant à régler maintenant + récapitulatif live, cœur UX du
 * gating par acompte. Le voyageur choisit COMBIEN payer en ligne : minimum =
 * acompte (borne basse verrouillée), maximum = total du séjour. Raccourcis
 * (acompte / moitié / total) + curseur + saisie libre pour un montant
 * intermédiaire. Le serveur reborne TOUJOURS dans [acompte, total] — l'UI n'est
 * qu'un confort, jamais une source de vérité (cf. clampPayAmount).
 *
 * Composant CLIENT : aucune coordonnée de l'hôte n'y transite (révélées
 * seulement après confirmation, cf. getRevealedContacts).
 */
export function DepositPayment({
  bookingId,
  totalPrice,
  serviceFee,
  depositAmount,
  konnectEnabled,
}: {
  bookingId: string;
  totalPrice: number;
  serviceFee: number;
  depositAmount: number;
  konnectEnabled: boolean;
}) {
  const fr = useT();

  // Montant choisi (TND). Démarre à l'acompte minimum (le plus accessible).
  const [amount, setAmount] = useState(depositAmount);

  const clamp = (v: number) =>
    Math.min(Math.max(Math.round(Number.isFinite(v) ? v : depositAmount), depositAmount), totalPrice);

  const half = clamp(Math.round(totalPrice / 2));
  const pct = Math.round((amount / totalPrice) * 100);
  const balanceDue = totalPrice - amount;

  const shortcuts: { label: string; value: number }[] = [
    { label: fr.booking.raccourciAcompte(Math.round((depositAmount / totalPrice) * 100)), value: depositAmount },
    { label: fr.booking.raccourciMoitie, value: half },
    { label: fr.booking.raccourciTotalite, value: totalPrice },
  ];

  // Évite les doublons de raccourcis quand acompte == moitié == total (petits totaux).
  const seen = new Set<number>();
  const uniqueShortcuts = shortcuts.filter((s) =>
    seen.has(s.value) ? false : (seen.add(s.value), true)
  );

  return (
    <div className="mt-6">
      <h2 className="text-base font-bold text-heading">{fr.booking.montantAPayer}</h2>
      <p className="mt-1 text-xs leading-relaxed text-body/60">
        {fr.booking.montantAPayerAide}
      </p>

      {/* Raccourcis */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {uniqueShortcuts.map((s) => {
          const activeShortcut = amount === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setAmount(s.value)}
              className={`rounded-xl border px-2 py-2.5 text-center text-xs font-bold transition ${
                activeShortcut
                  ? "border-darna bg-darna text-white"
                  : "border-darna/15 bg-surface text-heading hover:bg-darna/5"
              }`}
            >
              <span className="block">{s.label}</span>
              <span className="mt-0.5 block text-[11px] font-medium opacity-80">
                {new Intl.NumberFormat("fr-FR").format(s.value)} TND
              </span>
            </button>
          );
        })}
      </div>

      {/* Curseur + saisie libre */}
      <div className="mt-4">
        <input
          type="range"
          min={depositAmount}
          max={totalPrice}
          step={1}
          value={amount}
          onChange={(e) => setAmount(clamp(Number(e.target.value)))}
          aria-label={fr.booking.montantAPayer}
          className="w-full accent-darna"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-body/55">
            {fr.booking.acompteMin} :{" "}
            {new Intl.NumberFormat("fr-FR").format(depositAmount)} TND
          </span>
          <label className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              min={depositAmount}
              max={totalPrice}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              onBlur={(e) => setAmount(clamp(Number(e.target.value)))}
              className="w-24 rounded-lg border border-darna/20 px-2 py-1.5 text-end text-sm font-bold text-heading focus:border-darna focus:outline-none"
            />
            <span className="text-sm font-semibold text-body/60">TND</span>
          </label>
        </div>
      </div>

      {/* Récapitulatif du paiement */}
      <dl className="mt-5 space-y-2.5 rounded-2xl bg-cream p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-body/70">{fr.booking.totalSejour}</dt>
          <dd>
            <Price amount={totalPrice} className="font-semibold text-body" />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-semibold text-heading">
            {fr.booking.payerMaintenant}
            <span className="ms-1 text-xs font-normal text-body/50">
              ({fr.booking.pourcentDuTotal(pct)})
            </span>
          </dt>
          <dd>
            <Price amount={amount} className="text-base font-bold text-heading" />
          </dd>
        </div>
        <div className="flex justify-between text-xs text-body/55">
          <dt>{fr.booking.dontCommission}</dt>
          <dd>
            <Price amount={serviceFee} />
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

      {/* Règle de remboursement (commission non remboursable) */}
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-sand-light/40 px-4 py-3 text-[11px] leading-relaxed font-medium text-darna-dark">
        <CoinsIcon width={15} height={15} className="mt-0.5 shrink-0" />
        {fr.booking.commissionNonRemboursable}
      </p>

      {/* Paiement : montant choisi transmis au serveur (reborné serveur). */}
      {konnectEnabled ? (
        <KonnectPayButton bookingId={bookingId} payAmount={amount} />
      ) : (
        <form action={confirmPaymentAction} className="mt-5">
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="payAmount" value={amount} />
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
