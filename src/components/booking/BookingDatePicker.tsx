"use client";

import { useMemo, useState } from "react";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { CalendarIcon, ArrowRightIcon, CloseIcon } from "@/components/icons";

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
 * Calendrier de réservation interactif (sélection de plage arrivée → départ dans
 * UN SEUL calendrier, deux mois affichés). Composant CONTRÔLÉ : l'état des dates
 * vit chez le parent (BookingPanel) qui en dérive le devis en direct.
 *
 * Design : bande de plage CONTINUE entre les deux dates, extrémités en pastilles
 * rondes, et un badge « X nuits » qui suit le survol (aperçu live de la durée).
 * Les nuits réservées/bloquées sont barrées et inertes ; on empêche de
 * sélectionner une plage qui chevauche une nuit indisponible.
 */
export function BookingDatePicker({
  unavailable,
  checkIn,
  checkOut,
  onChange,
  notes,
  monthsToShow = 2,
  showLegend = true,
  compact = false,
  onClose,
}: {
  unavailable: string[];
  checkIn: string | null;
  checkOut: string | null;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
  /**
   * Carte jour civil (YYYY-MM-DD) → note privée de l'hôte, affichée au survol du
   * jour bloqué. Réservée au calendrier de blocage de l'hôte (côté dashboard) :
   * absente du parcours voyageur, donc jamais montrée au public.
   */
  notes?: Record<string, string>;
  /**
   * Nombre de mois affichés côte à côte (défaut 2). On passe à 1 sur les petits
   * écrans (popover de recherche) pour que le panneau tienne sans scroll. La
   * navigation avance/recule alors d'autant de mois.
   */
  monthsToShow?: 1 | 2;
  /**
   * Affiche la légende (Sélectionné / Libre / Indisponible). Masquée dans le
   * popover de recherche — aucune date n'y est bloquée et ça raccourcit le
   * panneau pour qu'il tienne sans scroll.
   */
  showLegend?: boolean;
  /**
   * Densité compacte (padding et cellules resserrés). Indépendant du nombre de
   * mois : le popover de recherche affiche 2 mois EN compact.
   */
  compact?: boolean;
  /**
   * Si fourni, affiche un bouton de fermeture (✕) dans l'en-tête, à côté de
   * « Effacer ». Utilisé quand le calendrier est présenté en modale (recherche).
   */
  onClose?: () => void;
}) {
  const fr = useT();
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale] ?? "fr-FR";

  const unavailableSet = useMemo(() => new Set(unavailable), [unavailable]);
  const todayIso = useMemo(() => toIso(new Date()), []);

  const [hovered, setHovered] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

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
    return Array.from({ length: monthsToShow }, (_, i) => i).map((i) => {
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
  }, [offset, intlLocale, monthsToShow]);

  /** Une plage [a, b) chevauche-t-elle une nuit indisponible ? */
  function rangeHasUnavailable(a: string, b: string): boolean {
    return eachDay(a, b).some((d) => unavailableSet.has(d));
  }

  function handleSelect(iso: string) {
    if (iso < todayIso || unavailableSet.has(iso)) return;
    // Pas de sélection en cours, ou plage déjà complète → nouvelle arrivée.
    if (!checkIn || checkOut) {
      onChange(iso, null);
      return;
    }
    // Date antérieure ou égale, ou plage qui traverse une nuit bloquée → on repart.
    if (iso <= checkIn || rangeHasUnavailable(checkIn, iso)) {
      onChange(iso, null);
      return;
    }
    onChange(checkIn, iso);
  }

  // Fin de plage effective : départ choisi, ou aperçu au survol (si valide).
  const previewEnd =
    checkIn && !checkOut && hovered && hovered > checkIn && !rangeHasUnavailable(checkIn, hovered)
      ? hovered
      : null;
  const effectiveOut = checkOut ?? previewEnd;

  // Nuits effectives = plage choisie OU aperçu au survol (→ « X nuits » live).
  const effectiveNights =
    checkIn && effectiveOut ? nightsBetween(checkIn, effectiveOut) : 0;
  const hasRange = Boolean(checkIn && effectiveOut);

  const rangeLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short" });
    const fmtIso = (iso: string) => fmt.format(new Date(`${iso}T00:00:00`));
    if (checkIn && effectiveOut)
      return fr.booking.sejourDates(fmtIso(checkIn), fmtIso(effectiveOut));
    if (checkIn) return fr.booking.cliquezDepart;
    return fr.booking.cliquezArrivee;
  }, [checkIn, effectiveOut, intlLocale, fr.booking]);

  return (
    <div
      className={`rounded-3xl bg-surface shadow-sm ring-1 ring-darna/10 ${
        compact ? "p-4 sm:p-5" : "p-5 sm:p-7"
      }`}
    >
      {/* En-tête : intitulé + état de la sélection (nuits live, survol inclus) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-darna/10 text-heading">
            <CalendarIcon width={18} height={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-heading">{fr.booking.choisirDates}</p>
            <p className="text-xs font-medium text-muted">
              {hasRange ? (
                <>
                  {rangeLabel} ·{" "}
                  <span className="font-bold text-heading">
                    {fr.booking.nuits(effectiveNights)}
                  </span>
                </>
              ) : (
                rangeLabel
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {(checkIn || checkOut) && (
            <button
              type="button"
              onClick={() => {
                onChange(null, null);
                setHovered(null);
              }}
              className="rounded-full px-3 py-1 text-xs font-semibold text-muted transition hover:bg-cream hover:text-heading"
            >
              {fr.booking.effacer}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={fr.common.fermer}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-heading"
            >
              <CloseIcon width={18} height={18} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation mois */}
      <div className={`flex items-center justify-between ${compact ? "mt-3" : "mt-5"}`}>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.max(0, o - monthsToShow))}
          disabled={offset === 0}
          aria-label={fr.booking.moisPrecedent}
          className="flex h-9 w-9 items-center justify-center rounded-full text-heading transition hover:bg-cream disabled:opacity-25"
        >
          <ArrowRightIcon width={18} height={18} className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.min(MAX_OFFSET, o + monthsToShow))}
          disabled={offset >= MAX_OFFSET}
          aria-label={fr.booking.moisSuivant}
          className="flex h-9 w-9 items-center justify-center rounded-full text-heading transition hover:bg-cream disabled:opacity-25"
        >
          <ArrowRightIcon width={18} height={18} />
        </button>
      </div>

      {/* Grilles mensuelles (clic arrivée puis départ — un seul calendrier) */}
      <div
        className={`mt-3 grid gap-7 ${monthsToShow === 1 ? "grid-cols-1" : "sm:grid-cols-2"}`}
        onMouseLeave={() => setHovered(null)}
      >
        {months.map(({ key, first, daysInMonth, startWeekday, label }) => (
          <div key={key}>
            <p className={`text-center text-sm font-bold capitalize text-heading ${compact ? "mb-2" : "mb-3"}`}>
              {label}
            </p>
            {/* Pas de gap horizontal → la bande de plage est continue. */}
            <div className="grid grid-cols-7 gap-y-1">
              {weekdays.map((d, i) => (
                <span
                  key={`wd-${i}`}
                  className="pb-1 text-center text-[11px] font-semibold uppercase text-subtle"
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
                  checkIn && effectiveOut ? iso > checkIn && iso < effectiveOut : false;
                const isEndpoint = isStart || isEnd;
                // Note privée de l'hôte sur ce jour bloqué (jamais sur un jour passé).
                const note = !isPast ? notes?.[iso] : undefined;
                // Bande de plage continue : fond clair, arrondi seulement aux bouts.
                const band =
                  hasRange && (isEndpoint || inRange)
                    ? `bg-darna/10 ${isStart ? "rounded-s-full" : ""} ${
                        isEnd ? "rounded-e-full" : ""
                      }`
                    : "";

                return (
                  <div
                    key={iso}
                    className={`group relative flex items-center justify-center ${compact ? "h-10" : "h-11"} ${band}`}
                  >
                    {/* Badge « X nuits » sur la date de fin (réelle ou survolée). */}
                    {isEnd && hasRange ? (
                      <span className="pointer-events-none absolute -top-6 start-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-darna px-2 py-0.5 text-[10px] font-bold text-white shadow-md rtl:translate-x-1/2">
                        {fr.booking.nuits(effectiveNights)}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSelect(iso)}
                      onMouseEnter={() => setHovered(iso)}
                      aria-pressed={isEndpoint}
                      className={[
                        `relative flex items-center justify-center rounded-full text-sm transition ${compact ? "h-9 w-9" : "h-10 w-10"}`,
                        isEndpoint
                          ? "z-10 bg-darna font-bold text-white shadow-sm"
                          : inRange
                            ? "font-semibold text-heading"
                            : isPast
                              ? "cursor-default text-subtle"
                              : isUnavail
                                ? "cursor-not-allowed text-subtle line-through"
                                : "font-medium text-body hover:bg-darna/15 hover:text-heading",
                      ].join(" ")}
                    >
                      {i + 1}
                      {isUnavail && !isPast && (
                        <span
                          className={[
                            "absolute bottom-1 h-1 w-1 rounded-full",
                            note ? "bg-darna/70" : "bg-ink/30",
                          ].join(" ")}
                        />
                      )}
                    </button>
                    {note ? (
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full start-1/2 z-30 mb-1.5 w-max max-w-[12rem] -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-start text-xs font-medium leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 rtl:translate-x-1/2"
                      >
                        {note}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Légende (masquable : inutile dans le popover de recherche) */}
      {showLegend ? (
        <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted ${compact ? "mt-3" : "mt-5"}`}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-full bg-darna" />
            {fr.booking.selectionne}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-full bg-darna/10 ring-1 ring-darna/15" />
            {fr.property.jourLibre}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded bg-ink/5 ring-1 ring-ink/10" />
            <span className="line-through decoration-ink/40">{fr.property.legende}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
