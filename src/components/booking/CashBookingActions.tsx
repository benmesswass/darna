"use client";

import { useActionState, useState } from "react";
import {
  acceptCashBookingAction,
  declineCashBookingAction,
} from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Acceptation/refus hôte d'une demande Rail 2 (paiement sur place) — même
 * patron de confirmation que CancelBookingButton.tsx. Accepter confirme
 * immédiatement (pas d'étape supplémentaire, l'hôte a déjà vu le récap) ;
 * refuser passe par une confirmation explicite (action irréversible pour le
 * voyageur, dont les dates redeviennent disponibles pour d'autres).
 */
export function CashBookingActions({
  bookingId,
  montantCash,
}: {
  bookingId: string;
  /** Montant total dû cash par le voyageur — pour le rappel avant refus. */
  montantCash: number;
}) {
  const fr = useT();
  const [confirmingDecline, setConfirmingDecline] = useState(false);
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptCashBookingAction,
    undefined
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineCashBookingAction,
    undefined
  );

  if (acceptState?.success || declineState?.success) {
    return (
      <p className="text-xs font-semibold text-emerald-700">
        {acceptState?.success ?? declineState?.success}
      </p>
    );
  }

  if (confirmingDecline) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs">
        {declineState?.error ? (
          <p className="text-red-600">{declineState.error}</p>
        ) : null}
        <form action={declineAction} className="flex gap-2">
          <input type="hidden" name="bookingId" value={bookingId} />
          <button
            type="submit"
            disabled={declinePending}
            className="rounded-lg bg-red-600 px-3 py-1.5 font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {declinePending ? "…" : fr.dashboard.refuserConfirmer}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDecline(false)}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-100"
          >
            {fr.dashboard.refuserAnnuler}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-relaxed text-muted">
        {fr.dashboard.demandeCashRecapAide(montantCash)}
      </p>
      {acceptState?.error ? (
        <p className="text-xs text-red-600">{acceptState.error}</p>
      ) : null}
      <div className="flex gap-2">
        <form action={acceptAction}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <button
            type="submit"
            disabled={acceptPending}
            className="rounded-xl bg-darna px-3.5 py-2 text-xs font-bold text-white hover:bg-darna-light disabled:opacity-60"
          >
            {acceptPending ? "…" : fr.dashboard.accepterDemande}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirmingDecline(true)}
          className="rounded-xl border border-red-300 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          {fr.dashboard.refuserDemande}
        </button>
      </div>
    </div>
  );
}
