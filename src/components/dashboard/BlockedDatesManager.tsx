"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import {
  blockDatesAction,
  unblockDatesAction,
  type BlockDatesFormState,
} from "@/actions/properties";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { BookingDatePicker } from "@/components/booking/BookingDatePicker";
import { CloseIcon } from "@/components/icons";

const INTL_LOCALE: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-TN",
};

/** Un blocage : bornes arrivée → départ EXCLUSIF (ISO), comme une réservation. */
export type DateBlock = {
  id: string;
  start: string;
  end: string;
  reason: string | null;
};

/**
 * Gestion des dates bloquées d'une annonce (séjour perso, travaux…). Liste les
 * blocages en cours + sélection d'une nouvelle période au calendrier (on
 * réutilise le `BookingDatePicker` du parcours voyageur : modèle arrivée →
 * départ, et les dates déjà prises/bloquées sont grisées et non sélectionnables).
 */
export function BlockedDatesManager({
  propertyId,
  blocks,
  unavailable,
  notes,
}: {
  propertyId: string;
  blocks: DateBlock[];
  unavailable: string[];
  /** Jour civil → note du blocage, affichée au survol dans le calendrier. */
  notes: Record<string, string>;
}) {
  const fr = useT();
  const locale = useLocale();
  const intl = INTL_LOCALE[locale] ?? "fr-FR";
  const [state, action, pending] = useActionState<BlockDatesFormState, FormData>(
    blockDatesAction,
    undefined
  );
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  // Blocage en attente de confirmation de retrait (× cliqué, pas encore confirmé).
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Réinitialise la sélection une fois le blocage enregistré.
  useEffect(() => {
    if (state?.success) {
      setCheckIn(null);
      setCheckOut(null);
    }
  }, [state?.success]);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(intl, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${iso}T00:00:00`));

  const ready = Boolean(checkIn && checkOut);

  return (
    <div className="space-y-5">
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
              <span className="min-w-0 text-sm text-ink">
                <span className="font-medium">
                  {fr.booking.sejourDates(fmt(b.start), fmt(b.end))}
                </span>
                {b.reason ? (
                  <span className="block truncate text-xs text-ink/55">{b.reason}</span>
                ) : null}
              </span>
              {confirmingId === b.id ? (
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-medium text-ink/70">
                    {fr.annonceForm.blocageRetraitConfirmer}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="rounded-full px-3 py-1 text-xs font-semibold text-ink/55 transition hover:bg-cream hover:text-ink"
                  >
                    {fr.common.annuler}
                  </button>
                  <form action={unblockDatesAction}>
                    <input type="hidden" name="availabilityId" value={b.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      {fr.annonceForm.blocageRetraitOui}
                    </button>
                  </form>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(b.id)}
                  title={fr.annonceForm.supprimerBlocage}
                  aria-label={fr.annonceForm.supprimerBlocage}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/70 text-white transition hover:bg-red-600"
                >
                  <CloseIcon width={12} height={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Sélection d'une nouvelle période à bloquer */}
      <form action={action} className="space-y-4">
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
        <input type="hidden" name="start" value={checkIn ?? ""} />
        <input type="hidden" name="end" value={checkOut ?? ""} />

        <BookingDatePicker
          unavailable={unavailable}
          notes={notes}
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={(ci, co) => {
            setCheckIn(ci);
            setCheckOut(co);
          }}
        />

        <label className="block">
          <span className="sr-only">{fr.annonceForm.blocageNotePlaceholder}</span>
          <input
            type="text"
            name="reason"
            maxLength={120}
            placeholder={fr.annonceForm.blocageNotePlaceholder}
            className="w-full rounded-xl bg-cream px-3.5 py-2.5 text-sm text-ink ring-1 ring-darna/10 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-darna/40"
          />
        </label>

        <button
          type="submit"
          disabled={!ready || pending}
          className="rounded-2xl bg-darna px-6 py-3 text-sm font-bold text-white transition hover:bg-darna-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? fr.common.chargement : fr.annonceForm.bloquerDates}
        </button>
      </form>
    </div>
  );
}
