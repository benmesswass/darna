"use client";

import { useActionState } from "react";
import {
  submitFinancingLeadAction,
  type FinancingLeadFormState,
} from "@/actions/financing-lead";
import { useT } from "@/components/i18n/LocaleProvider";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-darna";

export function FinancingLeadForm({
  propertyId,
  defaults,
}: {
  propertyId: string;
  defaults: { name: string; email: string; phone: string };
}) {
  const fr = useT();
  const [state, action, pending] = useActionState<FinancingLeadFormState, FormData>(
    submitFinancingLeadAction,
    undefined
  );

  if (state?.success) {
    return (
      <p
        role="status"
        className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700"
      >
        {state.success}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3.5">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="propertyId" value={propertyId} />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-muted">{fr.contact.nom}</span>
          <input
            name="name"
            type="text"
            required
            minLength={2}
            defaultValue={defaults.name}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-muted">{fr.contact.email}</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaults.email}
            className={inputClass}
          />
        </label>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-muted">{fr.contact.telephone}</span>
          <input
            name="phone"
            type="tel"
            required
            defaultValue={defaults.phone}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-muted">
            {fr.financement.montantSouhaite} <span className="text-subtle">({fr.common.optionnel})</span>
          </span>
          <input name="desiredAmount" type="number" min={1000} className={inputClass} />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-muted">
          {fr.contact.message} <span className="text-subtle">({fr.common.optionnel})</span>
        </span>
        <textarea name="message" rows={3} className={inputClass} />
      </label>
      <p className="text-xs text-muted">{fr.financement.disclaimer}</p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-darna px-6 py-2.5 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
      >
        {pending ? fr.common.chargement : fr.financement.envoyer}
      </button>
    </form>
  );
}
