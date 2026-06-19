"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { BookingDatePicker } from "@/components/booking/BookingDatePicker";
import { CalendarIcon } from "@/components/icons";

const INTL_LOCALE: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-TN",
};

/**
 * Champ « Arrivée / Départ » de la barre de recherche : deux déclencheurs
 * compacts qui ouvrent le calendrier moderne `BookingDatePicker` (plage sur
 * deux mois, mêmes interactions que la réservation) en popover, au lieu de
 * l'input date natif du navigateur.
 *
 * Reste compatible GET : la sélection alimente deux `<input hidden>`
 * (`arrivee`/`depart` en ISO YYYY-MM-DD), donc le formulaire parent se soumet
 * sans JS supplémentaire. Rendu en fragment de deux cellules de grille pour
 * préserver le gabarit de la barre de recherche.
 */
export function SearchDateRange({
  defaultCheckIn,
  defaultCheckOut,
  fieldClassName,
  labelClassName = "flex flex-col gap-1",
  labelTextClassName = "flex items-center gap-1 text-xs font-semibold text-ink/60",
  labelStyle,
}: {
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  /** Style du bouton-champ (aligné sur les autres champs de la barre). */
  fieldClassName: string;
  /** Conteneur de cellule (par défaut une colonne de la grille). */
  labelClassName?: string;
  /** Style du libellé (icône + texte). */
  labelTextClassName?: string;
  /** Style inline du libellé (couleur d'ambiance du Hero). */
  labelStyle?: React.CSSProperties;
}) {
  const fr = useT();
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale] ?? "fr-FR";

  const [checkIn, setCheckIn] = useState<string | null>(defaultCheckIn ?? null);
  const [checkOut, setCheckOut] = useState<string | null>(defaultCheckOut ?? null);
  const [open, setOpen] = useState(false);
  // Côté d'ancrage du popover : par défaut au début du champ ; basculé en fin si
  // les deux mois déborderaient à droite (largeurs intermédiaires). Positionné
  // via propriétés logiques inline → fiable et compatible RTL.
  const [alignEnd, setAlignEnd] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const el = dialogRef.current;
    if (!el) return;
    // Repart de l'ancrage par défaut, puis bascule si le bord de fin dépasse.
    setAlignEnd(false);
    const rect = el.getBoundingClientRect();
    const margin = 8;
    if (rect.right > window.innerWidth - margin) setAlignEnd(true);
  }, [open]);

  // Click-outside / Échap : on ferme dès que l'interaction sort du champ ou du
  // popover (tous deux marqués `data-search-dates`).
  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-search-dates]")) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function fmt(iso: string | null): string | null {
    if (!iso) return null;
    return new Intl.DateTimeFormat(intlLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(`${iso}T00:00:00`));
  }

  const field = (which: "in" | "out") => {
    const value = which === "in" ? fmt(checkIn) : fmt(checkOut);
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between text-start ${fieldClassName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? "text-ink" : "text-ink/40"}>
          {value ?? fr.search.datePlaceholder}
        </span>
        <CalendarIcon width={15} height={15} className="shrink-0 text-darna/60" />
      </button>
    );
  };

  return (
    <>
      <label data-search-dates className={`relative ${labelClassName}`}>
        <span className={labelTextClassName} style={labelStyle}>
          <CalendarIcon width={13} height={13} />
          {fr.search.arrivee}
        </span>
        {field("in")}
        {open ? (
          <div
            ref={dialogRef}
            data-search-dates
            role="dialog"
            aria-label={fr.booking.choisirDates}
            className="absolute top-full z-[1070] mt-2 w-[18rem] max-w-[90vw] sm:w-[40rem]"
            style={
              alignEnd
                ? { insetInlineEnd: 0, insetInlineStart: "auto" }
                : { insetInlineStart: 0, insetInlineEnd: "auto" }
            }
          >
            <BookingDatePicker
              unavailable={[]}
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={(ci, co) => {
                setCheckIn(ci);
                setCheckOut(co);
                // Plage complète → on referme pour libérer la barre.
                if (ci && co) setOpen(false);
              }}
            />
          </div>
        ) : null}
      </label>

      <label data-search-dates className={labelClassName}>
        <span className={labelTextClassName} style={labelStyle}>
          <CalendarIcon width={13} height={13} />
          {fr.search.depart}
        </span>
        {field("out")}
      </label>

      <input type="hidden" name="arrivee" value={checkIn ?? ""} />
      <input type="hidden" name="depart" value={checkOut ?? ""} />
    </>
  );
}
