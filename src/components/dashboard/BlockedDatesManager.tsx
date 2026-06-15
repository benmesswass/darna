"use client";

import { useActionState } from "react";
import {
  blockDatesAction,
  unblockDatesAction,
  type BlockDatesFormState,
} from "@/actions/properties";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { CloseIcon } from "@/components/icons";

const INTL_LOCALE: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-TN",
};

/** Un blocage affiché : bornes en jour civil INCLUSIF (start..end). */
export type DateBlock = { id: string; start: string; end: string };

/**
 * Gestion des dates bloquées d'une annonce (séjour perso, travaux…). Liste les
 * blocages en cours + formulaire d'ajout. Les bornes sont INCLUSIVES côté UI ;
 * la conversion en `endDate` exclusive est faite côté serveur (blockDatesAction).
 */
export function BlockedDatesManager({
  propertyId,
  blocks,
}: {
  propertyId: string;
  blocks: DateBlock[];
}) {
  const fr = useT();
  const locale = useLocale();
  const intl = INTL_LOCALE[locale] ?? "fr-FR";
  const [state, action, pending] = useActionState<BlockDatesFormState, FormData>(
    blockDatesAction,
    undefined
  );

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(intl, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${iso}T00:00:00`));

  // Borne « pas de date passée » pour les sélecteurs natifs.
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink/50">{fr.annonceForm.disponibilitesAide}</p>

      {/* Blocages en cours */}
      {blocks.length === 0 ? (
        <p className="rounded-2xl bg-cream/60 px-4 py-3 text-sm text-ink/55">
          {fr.annonceForm.aucunBlocage}
        </p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-cream/60 px-4 py-2.5 ring-1 ring-darna/10"
            >
              <span className="text-sm font-medium text-ink">
                {fr.annonceForm.blocagePeriode(fmt(b.start), fmt(b.end))}
              </span>
              <form action={unblockDatesAction}>
                <input type="hidden" name="availabilityId" value={b.id} />
                <button
                  type="submit"
                  title={fr.annonceForm.supprimerBlocage}
                  aria-label={fr.annonceForm.supprimerBlocage}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white transition hover:bg-red-600"
                >
                  <CloseIcon width={12} height={12} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* Ajout d'un blocage */}
      <form
        action={action}
        className="rounded-2xl border border-dashed border-darna/25 bg-cream/60 p-4"
      >
        {state?.error ? (
          <p
            role="alert"
            className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
          >
            {state.error}
          </p>
        ) : null}
        {state?.success ? (
          <p
            role="status"
            className="mb-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700"
          >
            {state.success}
          </p>
        ) : null}
        <input type="hidden" name="propertyId" value={propertyId} />
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink/70">
            {fr.annonceForm.blocageDebut}
            <input
              type="date"
              name="start"
              required
              min={todayIso}
              className="rounded-lg bg-white px-3 py-2 text-sm text-ink ring-1 ring-darna/15 focus:outline-none focus:ring-2 focus:ring-darna/40"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink/70">
            {fr.annonceForm.blocageFin}
            <input
              type="date"
              name="end"
              required
              min={todayIso}
              className="rounded-lg bg-white px-3 py-2 text-sm text-ink ring-1 ring-darna/15 focus:outline-none focus:ring-2 focus:ring-darna/40"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-darna px-5 py-2.5 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
          >
            {pending ? fr.common.chargement : fr.annonceForm.bloquerDates}
          </button>
        </div>
      </form>
    </div>
  );
}
