"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction, type ProfileFormState } from "@/actions/profile";
import { useT } from "@/components/i18n/LocaleProvider";
import { TrashIcon } from "@/components/icons";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none transition focus:border-darna focus:ring-2 focus:ring-darna/20";

/**
 * Suppression de compte (LANCEMENT_ROADMAP.md §L7.3) — même patron de
 * confirmation en deux temps que CashBookingActions.tsx (refuser une
 * demande) : un bouton seul ne déclenche rien d'irréversible.
 */
export function DeleteAccountForm({ hasPassword }: { hasPassword: boolean }) {
  const fr = useT();
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    deleteAccountAction,
    undefined
  );

  return (
    <section className="rounded-3xl bg-surface p-6 ring-1 ring-red-200">
      <p className="flex items-center gap-2 font-semibold text-red-700">
        <TrashIcon width={18} height={18} />
        {fr.profil.supprimerTitre}
      </p>
      <p className="mt-1 text-sm text-muted">{fr.profil.supprimerAide}</p>

      {state?.error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 rounded-xl border border-red-300 px-5 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50"
        >
          {fr.profil.supprimerBouton}
        </button>
      ) : (
        <form action={action} className="mt-4 space-y-3">
          {hasPassword ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-body/70">{fr.profil.mdpActuel}</span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </label>
          ) : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {pending ? fr.common.chargement : fr.profil.supprimerConfirmer}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-xl border border-darna/20 px-5 py-2.5 text-sm font-semibold text-heading hover:bg-darna/5"
            >
              {fr.profil.supprimerAnnuler}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
