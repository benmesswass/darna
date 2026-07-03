"use client";

import { useActionState } from "react";
import { saveSearchAction, type SavedSearchFormState } from "@/actions/saved-search";
import { useT } from "@/components/i18n/LocaleProvider";
import { BellIcon } from "@/components/icons";

/**
 * Bouton « Créer une alerte » (F7) : enregistre la recherche courante
 * (ville + budget). Rendu uniquement pour une ville résolue et un voyageur
 * connecté (cf. sejours/page.tsx).
 */
export function SaveSearchButton({
  ville,
  prixMin,
  prixMax,
}: {
  ville: string;
  prixMin?: string;
  prixMax?: string;
}) {
  const fr = useT();
  const [state, action, pending] = useActionState<SavedSearchFormState, FormData>(
    saveSearchAction,
    undefined
  );

  if (state?.success) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
        <BellIcon width={13} height={13} />
        {state.success}
      </span>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="ville" value={ville} />
      {prixMin ? <input type="hidden" name="prixMin" value={prixMin} /> : null}
      {prixMax ? <input type="hidden" name="prixMax" value={prixMax} /> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-heading ring-1 ring-darna/20 transition hover:bg-darna/5 disabled:opacity-60"
      >
        <BellIcon width={13} height={13} />
        {fr.search.creerAlerte}
      </button>
      {state?.error ? (
        <span className="text-xs font-medium text-red-600">{state.error}</span>
      ) : null}
    </form>
  );
}
