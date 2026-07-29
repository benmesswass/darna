"use client";

import { useActionState } from "react";
import { applyWakilAction, type WakilFormState } from "@/actions/wakil";
import { useT } from "@/components/i18n/LocaleProvider";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-darna";

export function WakilForm({ captchaSiteKey = "" }: { captchaSiteKey?: string }) {
  const fr = useT();
  const [state, action, pending] = useActionState<WakilFormState, FormData>(
    applyWakilAction,
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
    <form action={action} className="space-y-4">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-body/70">{fr.wakil.nom}</span>
          <input name="name" type="text" required minLength={2} className={inputClass} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-body/70">{fr.wakil.email}</span>
          <input name="email" type="email" required className={inputClass} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-body/70">{fr.wakil.telephone}</span>
          <input name="phone" type="tel" required className={inputClass} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-body/70">{fr.wakil.ville}</span>
          <input name="city" type="text" required minLength={2} className={inputClass} />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-body/70">{fr.wakil.motivation}</span>
        <textarea
          name="motivation"
          required
          minLength={20}
          maxLength={2000}
          rows={4}
          className={inputClass}
        />
      </label>
      <TurnstileWidget siteKey={captchaSiteKey} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-darna px-8 py-3 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
      >
        {pending ? fr.common.chargement : fr.wakil.postuler}
      </button>
    </form>
  );
}
