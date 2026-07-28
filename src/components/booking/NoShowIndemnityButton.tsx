"use client";

import { useActionState, useState } from "react";
import { claimNoShowIndemnityAction } from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Garantie no-show hôte (LANCEMENT_ROADMAP.md §L5.4) — rail ESCROW
 * uniquement, DISTINCT de NoShowButton.tsx (rail SUR_PLACE, sans indemnité).
 * Même patron confirming/form.
 */
export function NoShowIndemnityButton({ bookingId }: { bookingId: string }) {
  const fr = useT();
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(claimNoShowIndemnityAction, undefined);

  if (state?.success) {
    return <p className="text-xs font-semibold text-body/60">{state.success}</p>;
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl border border-darna/15 px-3.5 py-2 text-xs font-semibold text-body/70 hover:bg-cream"
      >
        {fr.dashboard.signalerNoShowIndemnite}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-darna/15 bg-cream p-3 text-xs">
      <p className="font-semibold text-heading">{fr.dashboard.noShowIndemniteAvertissement}</p>
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
