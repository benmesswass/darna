"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { BookingDatePicker } from "@/components/booking/BookingDatePicker";
import { DestinationPanel } from "@/components/search/DestinationPanel";
import { destinationPreviewAction } from "@/actions/destination";
import type { DestinationPreview } from "@/lib/destination";
import { CalendarIcon } from "@/components/icons";

const INTL_LOCALE: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-TN",
};

/**
 * Champ « Arrivée / Départ » de la barre de recherche : deux déclencheurs
 * compacts qui ouvrent le calendrier moderne `BookingDatePicker` (plage sur
 * deux mois, mêmes interactions que la réservation) dans une MODALE centrée
 * (voile sombre, façon Airbnb), au lieu de l'input date natif du navigateur.
 *
 * La modale est rendue en portail sur `document.body` : elle échappe ainsi à
 * tout `overflow`/empilement du Hero et se place toujours au centre du viewport,
 * quelle que soit la hauteur de la page → jamais besoin de scroller pour la voir.
 *
 * Reste compatible GET : la sélection alimente deux `<input hidden>`
 * (`arrivee`/`depart` en ISO YYYY-MM-DD), donc le formulaire parent se soumet
 * sans JS supplémentaire. Rendu en fragment de deux cellules de grille pour
 * préserver le gabarit de la barre de recherche.
 */
export function SearchDateRange({
  defaultCheckIn,
  defaultCheckOut,
  ville,
  fieldClassName,
  labelClassName = "flex flex-col gap-1",
  labelTextClassName = "flex items-center gap-1 text-xs font-semibold text-body/60",
  labelStyle,
}: {
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  /** Ville saisie dans la barre (alimente le panneau d'inspiration destination). */
  ville?: string;
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

  // Aperçu « inspiration destination » (colonne de droite de la modale).
  const [preview, setPreview] = useState<DestinationPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  // Jeton de requête : on n'applique que la réponse de la dernière demande
  // (la ville/les dates peuvent changer pendant que la modale est ouverte).
  const reqIdRef = useRef(0);

  // Charge l'aperçu à l'ouverture, puis à chaque changement de ville/dates tant
  // que la modale est ouverte. Calculé côté serveur (vraies annonces + météo).
  useEffect(() => {
    if (!open) return;
    const reqId = ++reqIdRef.current;
    setPreviewLoading(true);
    destinationPreviewAction({
      ville,
      arrivee: checkIn ?? undefined,
      depart: checkOut ?? undefined,
    })
      .then((res) => {
        if (reqIdRef.current === reqId) {
          setPreview(res);
          setPreviewLoading(false);
        }
      })
      .catch(() => {
        if (reqIdRef.current === reqId) setPreviewLoading(false);
      });
  }, [open, ville, checkIn, checkOut]);

  // Modale ouverte : fermeture au clavier (Échap) + gel du scroll de l'arrière-
  // plan pour que seule la modale « vive ».
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

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
        <span className={value ? "text-body" : "text-body/40"}>
          {value ?? fr.search.datePlaceholder}
        </span>
        <CalendarIcon width={15} height={15} className="shrink-0 text-heading/60" />
      </button>
    );
  };

  return (
    <>
      <label className={labelClassName}>
        <span className={labelTextClassName} style={labelStyle}>
          <CalendarIcon width={13} height={13} />
          {fr.search.arrivee}
        </span>
        {field("in")}
      </label>

      <label className={labelClassName}>
        <span className={labelTextClassName} style={labelStyle}>
          <CalendarIcon width={13} height={13} />
          {fr.search.depart}
        </span>
        {field("out")}
      </label>

      <input type="hidden" name="arrivee" value={checkIn ?? ""} />
      <input type="hidden" name="depart" value={checkOut ?? ""} />

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              // Voile : clic sur le fond → fermeture.
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
              }}
              className="fixed inset-0 z-[1100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={fr.booking.choisirDates}
                className="flex max-h-[92vh] w-full max-w-[60rem] flex-col gap-3 overflow-y-auto sm:flex-row sm:items-stretch"
              >
                {/* Tâche principale : le calendrier */}
                <div className="sm:flex-[1.4]">
                  <BookingDatePicker
                    unavailable={[]}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    showLegend={false}
                    onClose={() => setOpen(false)}
                    onChange={(ci, co) => {
                      setCheckIn(ci);
                      setCheckOut(co);
                      // Plage complète → on referme pour libérer la barre.
                      if (ci && co) setOpen(false);
                    }}
                  />
                </div>
                {/* Inspiration destination (météo, logements, recommandations) */}
                <aside className="sm:flex-1">
                  <DestinationPanel loading={previewLoading} data={preview} />
                </aside>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
