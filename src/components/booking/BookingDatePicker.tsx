"use client";

import { useMemo, useState } from "react";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { CalendarIcon, UsersIcon, ArrowRightIcon } from "@/components/icons";

const INTL_LOCALE: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-TN",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_OFFSET = 10; // navigation jusqu'à ~12 mois (2 mois affichés à la fois)

/** Civil day (YYYY-MM-DD) à partir des composantes locales — sans dérive de fuseau. */
function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Itère les jours civils de `startIso` (inclus) à `endIso` (exclu) — arithmétique UTC robuste. */
function eachDay(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  let t = Date.parse(`${startIso}T00:00:00.000Z`);
  const end = Date.parse(`${endIso}T00:00:00.000Z`);
  while (t < end) {
    out.push(new Date(t).toISOString().slice(0, 10));
    t += DAY_MS;
  }
  return out;
}

function nightsBetween(startIso: string, endIso: string): number {
  return Math.round(
    (Date.parse(`${endIso}T00:00:00.000Z`) - Date.parse(`${startIso}T00:00:00.000Z`)) /
      DAY_MS
  );
}

/**
 * Calendrier de réservation interactif (sélection de plage arrivée → départ).
 *
 * - Affiche les disponibilités directement : nuits réservées ou bloquées barrées.
 * - Empêche de sélectionner une plage qui chevauche une nuit indisponible.
 * - Reste un formulaire GET : le serveur recalcule le récapitulatif et les prix
 *   (les montants ne transitent jamais par le client — invariant de sécurité).
 */
export function BookingDatePicker({
  unavailable,
  maxGuests,
  defaultArrivee,
  defaultDepart,
  defaultVoyageurs,
}: {
  unavailable: string[];
  maxGuests: number;
  defaultArrivee: string;
  defaultDepart: string;
  defaultVoyageurs: number;
}) {
  const fr = useT();
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale] ?? "fr-FR";

  const unavailableSet = useMemo(() => new Set(unavailable), [unavailable]);
  const todayIso = useMemo(() => toIso(new Date()), []);

  const [checkIn, setCheckIn] = useState<string | null>(defaultArrivee || null);
  const [checkOut, setCheckOut] = useState<string | null>(defaultDepart || null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [voyageurs, setVoyageurs] = useState(defaultVoyageurs);

  // Libellés de jours (Lun → Dim) selon la locale active.
  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale, { weekday: "narrow" });
    // 2024-01-01 est un lundi.
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(Date.UTC(2024, 0, 1 + i)))
    );
  }, [intlLocale]);

  const months = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    return [0, 1].map((i) => {
      const first = new Date(base.getFullYear(), base.getMonth() + offset + i, 1);
      const daysInMonth = new Date(
        first.getFullYear(),
        first.getMonth() + 1,
        0
      ).getDate();
      const startWeekday = (first.getDay() + 6) % 7; // Lundi = 0
      const label = new Intl.DateTimeFormat(intlLocale, {
        month: "long",
        year: "numeric",
      }).format(first);
      return { key: toIso(first), first, daysInMonth, startWeekday, label };
    });
  }, [offset, intlLocale]);

  /** Une plage [a, b) chevauche-t-elle une nuit indisponible ? */
  function rangeHasUnavailable(a: string, b: string): boolean {
    return eachDay(a, b).some((d) => unavailableSet.has(d));
  }

  function handleSelect(iso: string) {
    if (iso < todayIso || unavailableSet.has(iso)) return;
    // Pas de sélection en cours, ou plage déjà complète → nouvelle arrivée.
    if (!checkIn || checkOut) {
      setCheckIn(iso);
      setCheckOut(null);
      return;
    }
    // Date antérieure ou égale → on repart de cette arrivée.
    if (iso <= checkIn) {
      setCheckIn(iso);
      setCheckOut(null);
      return;
    }
    // La plage traverserait une nuit bloquée → on repart de cette date.
    if (rangeHasUnavailable(checkIn, iso)) {
      setCheckIn(iso);
      setCheckOut(null);
      return;
    }
    setCheckOut(iso);
  }

  // Fin de plage effective : départ choisi, ou aperçu au survol (si valide).
  const previewEnd =
    checkIn && !checkOut && hovered && hovered > checkIn && !rangeHasUnavailable(checkIn, hovered)
      ? hovered
      : null;
  const effectiveOut = checkOut ?? previewEnd;

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const complete = Boolean(checkIn && checkOut);

  const rangeLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short" });
    const fmtIso = (iso: string) => fmt.format(new Date(`${iso}T00:00:00`));
    if (checkIn && checkOut) return fr.booking.sejourDates(fmtIso(checkIn), fmtIso(checkOut));
    if (checkIn) return fr.booking.cliquezDepart;
    return fr.booking.cliquezArrivee;
  }, [checkIn, checkOut, intlLocale, fr.booking]);

  function clear() {
    setCheckIn(null);
    setCheckOut(null);
    setHovered(null);
  }

  return (
    <form
      method="GET"
      className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-darna/10 sm:p-7"
    >
      <input type="hidden" name="arrivee" value={checkIn ?? ""} />
      <input type="hidden" name="depart" value={checkOut ?? ""} />

      {/* En-tête : intitulé + état de la sélection */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-darna/10 text-darna">
            <CalendarIcon width={18} height={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-darna">{fr.booking.choisirDates}</p>
            <p className="text-xs font-medium text-ink/55">
              {complete ? (
                <>
                  {rangeLabel} · {fr.booking.nuits(nights)}
                </>
              ) : (
                rangeLabel
              )}
            </p>
          </div>
        </div>
        {(checkIn || checkOut) && (
          <button
            type="button"
            onClick={clear}
            className="rounded-full px-3 py-1 text-xs font-semibold text-ink/50 transition hover:bg-cream hover:text-darna"
          >
            {fr.booking.effacer}
          </button>
        )}
      </div>

      {/* Navigation mois */}
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => Math.max(0, o - 2))}
          disabled={offset === 0}
          aria-label={fr.booking.moisPrecedent}
          className="flex h-9 w-9 items-center justify-center rounded-full text-darna transition hover:bg-cream disabled:opacity-25"
        >
          <ArrowRightIcon width={18} height={18} className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.min(MAX_OFFSET, o + 2))}
          disabled={offset >= MAX_OFFSET}
          aria-label={fr.booking.moisSuivant}
          className="flex h-9 w-9 items-center justify-center rounded-full text-darna transition hover:bg-cream disabled:opacity-25"
        >
          <ArrowRightIcon width={18} height={18} />
        </button>
      </div>

      {/* Grilles mensuelles */}
      <div className="mt-3 grid gap-7 sm:grid-cols-2">
        {months.map(({ key, first, daysInMonth, startWeekday, label }) => (
          <div key={key}>
            <p className="mb-3 text-center text-sm font-bold capitalize text-darna">
              {label}
            </p>
            <div className="grid grid-cols-7 gap-1">
              {weekdays.map((d, i) => (
                <span
                  key={`wd-${i}`}
                  className="pb-1 text-center text-[11px] font-semibold uppercase text-ink/35"
                >
                  {d}
                </span>
              ))}
              {Array.from({ length: startWeekday }).map((_, i) => (
                <span key={`pad-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const date = new Date(first.getFullYear(), first.getMonth(), i + 1);
                const iso = toIso(date);
                const isPast = iso < todayIso;
                const isUnavail = unavailableSet.has(iso);
                const isDisabled = isPast || isUnavail;
                const isStart = iso === checkIn;
                const isEnd = iso === effectiveOut;
                const inRange =
                  effectiveOut && checkIn ? iso > checkIn && iso < effectiveOut : false;
                const isEndpoint = isStart || isEnd;

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelect(iso)}
                    onMouseEnter={() => setHovered(iso)}
                    aria-pressed={isEndpoint}
                    className={[
                      "relative flex h-11 items-center justify-center text-sm transition",
                      isEndpoint
                        ? "z-10 rounded-xl bg-darna font-bold text-white shadow-sm"
                        : inRange
                          ? "bg-darna/10 font-semibold text-darna"
                          : isPast
                            ? "cursor-default text-ink/25"
                            : isUnavail
                              ? "cursor-not-allowed text-ink/30 line-through"
                              : "rounded-xl font-medium text-ink hover:bg-darna/10 hover:text-darna",
                      // Coins arrondis aux extrémités de plage.
                      isStart && effectiveOut ? "rounded-e-none" : "",
                      isEnd && checkIn ? "rounded-s-none" : "",
                    ].join(" ")}
                  >
                    {i + 1}
                    {isUnavail && !isPast && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-ink/30" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded bg-darna" />
          {fr.booking.selectionne}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded bg-darna/10 ring-1 ring-darna/15" />
          {fr.property.jourLibre}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded bg-ink/5 ring-1 ring-ink/10" />
          <span className="line-through decoration-ink/40">{fr.property.legende}</span>
        </span>
      </div>

      {/* Voyageurs + recherche */}
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-darna/10 pt-5">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1 text-xs font-semibold text-ink/60">
            <UsersIcon width={13} height={13} />
            {fr.search.voyageurs}
          </span>
          <div className="flex items-center gap-1 rounded-xl border border-darna/15 bg-cream p-1">
            <button
              type="button"
              aria-label="-"
              onClick={() => setVoyageurs((v) => Math.max(1, v - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-darna transition hover:bg-white disabled:opacity-30"
              disabled={voyageurs <= 1}
            >
              −
            </button>
            <input
              type="number"
              name="voyageurs"
              min={1}
              max={maxGuests}
              value={voyageurs}
              onChange={(e) =>
                setVoyageurs(
                  Math.max(1, Math.min(maxGuests, Number(e.target.value) || 1))
                )
              }
              className="w-10 bg-transparent text-center text-sm font-bold text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              aria-label="+"
              onClick={() => setVoyageurs((v) => Math.min(maxGuests, v + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-darna transition hover:bg-white disabled:opacity-30"
              disabled={voyageurs >= maxGuests}
            >
              +
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={!complete}
          className="ms-auto rounded-xl bg-darna px-6 py-3 text-sm font-bold text-white transition hover:bg-darna-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          {fr.common.rechercher}
        </button>
      </div>
    </form>
  );
}
