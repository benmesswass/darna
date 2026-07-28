"use client";

import { useActionState, useState } from "react";
import { reportNoShowAction } from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Signalement d'un no-show voyageur par l'hôte, sur une réservation Rail 2
 * confirmée dont le check-in est passé — même patron de confirmation que
 * CancelBookingButton.tsx. Seul levier dissuasif en Rail 2 (pas de garantie
 * financière) : suspend le compte du voyageur, cf. reportNoShowAction.
 */
export function NoShowButton({ bookingId }: { bookingId: string }) {
  const fr = useT();
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(reportNoShowAction, undefined);

  if (state?.success) {
    return <p className="text-xs font-semibold text-muted">{state.success}</p>;
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl border border-darna/15 px-3.5 py-2 text-xs font-semibold text-body/70 hover:bg-cream"
      >
        {fr.dashboard.signalerNoShow}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-darna/15 bg-cream p-3 text-xs">
      <p className="font-semibold text-heading">{fr.dashboard.noShowAvertissement}</p>
      {state?.error ? <p className="mt-1 text-red-600">{state.error}</p> : null}
      <form action={action} className="mt-2 flex gap-2">
        <input type="hidden" name="bookingId" value={bookingId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-darna px-3 py-1.5 font-bold text-white hover:bg-darna-light disabled:opacity-50"
        >
          {pending ? "…" : fr.dashboard.noShowConfirmer}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-darna/20 px-3 py-1.5 text-body/70 hover:bg-surface"
        >
          {fr.dashboard.noShowAnnuler}
        </button>
      </form>
    </div>
  );
}
