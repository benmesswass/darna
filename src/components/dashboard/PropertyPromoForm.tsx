"use client";

import { useActionState } from "react";
import {
  setPropertyPromoAction,
  type PropertyPromoFormState,
} from "@/actions/properties";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Formulaire d'activation d'une promo hôte (CROISSANCE_ROADMAP.md §PM1).
 * `price - 1` en borne haute côté client : confort UX seulement — le serveur
 * revalide de toute façon `promoPrice < price` (setPropertyPromoAction).
 */
export function PropertyPromoForm({
  propertyId,
  price,
}: {
  propertyId: string;
  price: number;
}) {
  const fr = useT();
  const [state, action, pending] = useActionState<PropertyPromoFormState, FormData>(
    setPropertyPromoAction,
    undefined
  );

  return (
    <form action={action} className="mt-5 space-y-4">
      {state?.error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
        >
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700"
        >
          {state.success}
        </p>
      ) : null}
      <input type="hidden" name="propertyId" value={propertyId} />

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-body/70">
          {fr.promo.formPrixLabel}
        </span>
        <input
          type="number"
          name="promoPrice"
          min={1}
          max={Math.max(1, price - 1)}
          required
          className="w-full rounded-xl bg-cream px-3.5 py-2.5 text-sm text-body ring-1 ring-darna/10 focus:outline-none focus:ring-2 focus:ring-darna/40"
        />
        <span className="mt-1 block text-xs text-muted">{fr.promo.formPrixAide}</span>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-body/70">
          {fr.promo.formDateLabel}
        </span>
        <input
          type="date"
          name="promoUntil"
          required
          className="w-full rounded-xl bg-cream px-3.5 py-2.5 text-sm text-body ring-1 ring-darna/10 focus:outline-none focus:ring-2 focus:ring-darna/40"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? fr.common.chargement : fr.promo.activer}
      </button>
    </form>
  );
}
