"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { CITIES, suggestCities, type City } from "@/lib/geo";
import { MapPinIcon } from "@/components/icons";

/** Toutes les villes, triées alphabétiquement — affichées au clic / champ vide. */
const ALL_CITIES: City[] = [...CITIES].sort((a, b) =>
  a.name.localeCompare(b.name, "fr")
);

/**
 * Champ ville avec liste déroulante :
 * - au focus / clic, la liste s'ouvre sur **toutes** les villes tunisiennes ;
 * - dès que l'utilisateur tape, la liste se filtre (tolérante à la
 *   translittération : « dje » → Djerba, « 7am »/« hammam » → Hammamet,
 *   « soussa » → Sousse) ;
 * - sélection à la souris ou au clavier (↑ ↓ Entrée Échap).
 *
 * Composant non contrôlé vis-à-vis du formulaire (input name classique,
 * compatible GET).
 */
export function CityAutocomplete({
  name = "ville",
  defaultValue = "",
  placeholder,
  inputClassName,
  dropdownClassName = "",
  onValueChange,
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  inputClassName: string;
  dropdownClassName?: string;
  /** Notifié à chaque changement de la valeur (saisie ou sélection). Optionnel,
   *  n'affecte pas la soumission GET (input `name` classique conservé). */
  onValueChange?: (value: string) => void;
}) {
  const fr = useT();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  // Remonte la valeur courante au parent (toujours la dernière callback, sans
  // refaire tourner l'effet quand le parent passe une fonction inline).
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;
  useEffect(() => {
    onValueChangeRef.current?.(value);
  }, [value]);

  // Liste affichée : toutes les villes si le champ est vide, sinon le filtre.
  const suggestions = useMemo<City[]>(
    () => (value.trim() ? suggestCities(value, CITIES.length) : ALL_CITIES),
    [value]
  );

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Garde l'option active visible lors de la navigation clavier.
  useEffect(() => {
    if (open && activeIndex >= 0) {
      activeRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  function select(city: City) {
    setValue(city.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (suggestions.length > 0) {
        setActiveIndex((i) => (i + 1) % suggestions.length);
      }
    } else if (event.key === "ArrowUp") {
      if (!open || suggestions.length === 0) return;
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      if (open && activeIndex >= 0) {
        event.preventDefault();
        select(suggestions[activeIndex]);
      } else {
        setOpen(false);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <input
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={inputClassName}
      />
      {open && suggestions.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={fr.search.suggestionsVilles}
          className={`absolute inset-x-0 top-full z-[1060] mt-2 max-h-72 overflow-y-auto overflow-x-hidden rounded-2xl bg-surface py-1.5 shadow-xl ring-1 ring-darna/10 ${dropdownClassName}`}
        >
          {suggestions.map((city, index) => (
            <li key={city.name} role="option" aria-selected={index === activeIndex}>
              <button
                ref={index === activeIndex ? activeRef : null}
                type="button"
                onMouseDown={(e) => {
                  // mousedown : sélectionne avant le blur de l'input.
                  e.preventDefault();
                  select(city);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm transition ${
                  index === activeIndex ? "bg-cream text-heading" : "text-body"
                }`}
              >
                <MapPinIcon width={15} height={15} className="shrink-0 text-heading/60" />
                <span className="font-semibold">{city.name}</span>
                <span className="ml-auto text-xs text-body/45">{city.gouvernorat}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
