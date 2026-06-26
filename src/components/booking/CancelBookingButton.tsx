"use client";

import { useActionState, useState } from "react";
import { cancelBookingAction } from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";

interface Props {
  bookingId: string;
  refundAmount: number;
}

export function CancelBookingButton({ bookingId, refundAmount }: Props) {
  const fr = useT();
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(cancelBookingAction, undefined);

  if (state?.success) {
    return (
      <p className="text-xs font-semibold text-emerald-700">{state.success}</p>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl border border-red-300 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        {fr.dashboard.annulerReservation}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs">
      <p className="font-semibold text-red-800">
        {fr.dashboard.remboursement(refundAmount)}
      </p>
      {state?.error ? (
        <p className="mt-1 text-red-600">{state.error}</p>
      ) : null}
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
