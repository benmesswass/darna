"use client";

import { useActionState, useState } from "react";
import { hostCancelBookingAction } from "@/actions/bookings";
import { hostCancelBlockDays } from "@/lib/config";
import { useT } from "@/components/i18n/LocaleProvider";

interface Props {
  bookingId: string;
  /** ISO string — sert à calculer le palier de blocage AFFICHÉ (informatif,
   * l'action revérifie tout côté serveur à partir de la date réelle). */
  checkIn: string;
}

const DAY_MS = 86_400_000;

/**
 * Annulation à l'initiative de l'hôte (ANNULATION_HOTE_ROADMAP.md §AH1) —
 * même patron « zone danger » que CancelBookingButton/NoShowButton, avec un
 * avertissement explicite sur la conséquence (durée de blocage de l'annonce)
 * AVANT confirmation, calculée à partir du même barème que l'action serveur.
 */
export function HostCancelButton({ bookingId, checkIn }: Props) {
  const fr = useT();
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(hostCancelBookingAction, undefined);

  if (state?.success) {
    return <p className="text-xs font-semibold text-emerald-700">{state.success}</p>;
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl border border-red-300 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        {fr.dashboard.annulerReservationHote}
      </button>
    );
  }

  const daysUntilCheckIn = (new Date(checkIn).getTime() - Date.now()) / DAY_MS;
  const blockDays = hostCancelBlockDays(daysUntilCheckIn);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs">
      <p className="font-semibold text-red-900">{fr.dashboard.hostCancelAvertissementHumain}</p>
      <p className="mt-1.5 text-red-800">{fr.dashboard.hostCancelAvertissement(blockDays)}</p>
      {state?.error ? <p className="mt-1 text-red-600">{state.error}</p> : null}
      <form action={action} className="mt-2 flex gap-2">
        <input type="hidden" name="bookingId" value={bookingId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-600 px-3 py-1.5 font-bold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "…" : fr.dashboard.annulerConfirm}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-100"
        >
          {fr.dashboard.annulerAnnuler}
        </button>
      </form>
    </div>
  );
}
