"use client";

import { useActionState, useState } from "react";
import { reportNonConformityAction } from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";
import { NON_CONFORMITY_CATEGORIES } from "@/lib/constants";

/**
 * Garantie non-conformité (LANCEMENT_ROADMAP.md §L5.3) : signalement voyageur
 * si le logement ne correspond pas à l'annonce. L'éligibilité (fenêtre
 * checkIn → checkIn + 24h, statut, absence de signalement déjà déposé) est
 * calculée côté SERVEUR par le parent (dashboard/reservations/page.tsx) — ce
 * composant ne fait que soumettre le formulaire, même patron confirming/form
 * que NoShowButton.tsx.
 */
export function ReportNonConformityButton({ bookingId }: { bookingId: string }) {
  const fr = useT();
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(reportNonConformityAction, undefined);

  if (state?.success) {
    return <p className="text-xs font-semibold text-emerald-700">{state.success}</p>;
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl border border-darna/15 px-3.5 py-2 text-xs font-semibold text-body/70 hover:bg-cream"
      >
        {fr.dashboard.signalerProbleme}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-darna/15 bg-cream p-3 text-xs">
      <p className="font-semibold text-heading">{fr.dashboard.signalementAvertissement}</p>
      {state?.error ? <p className="mt-1 text-red-600">{state.error}</p> : null}
      <form action={action} className="mt-2 space-y-2">
        <input type="hidden" name="bookingId" value={bookingId} />
        <select
          name="category"
          required
          defaultValue=""
          className="w-full rounded-lg border border-darna/15 bg-surface px-3 py-2 text-xs outline-none focus:border-darna"
        >
          <option value="" disabled>
            {fr.dashboard.signalementCategorieLabel}
          </option>
          {NON_CONFORMITY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {fr.dashboard.signalementCategories[cat]}
            </option>
          ))}
        </select>
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={2000}
          rows={3}
          placeholder={fr.dashboard.signalementDescriptionPlaceholder}
          className="w-full rounded-lg border border-darna/15 bg-surface px-3 py-2 text-xs outline-none focus:border-darna"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-darna px-3 py-1.5 font-bold text-white hover:bg-darna-light disabled:opacity-50"
          >
            {pending ? "…" : fr.dashboard.signalementConfirmer}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-darna/20 px-3 py-1.5 text-body/70 hover:bg-surface"
          >
            {fr.dashboard.signalementAnnuler}
          </button>
        </div>
      </form>
    </div>
  );
}
