"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { suggestCities, type City } from "@/lib/geo";
import { MapPinIcon } from "@/components/icons";

/**
 * Champ ville avec autocomplétion tolérante à la translittération :
 * « dje » → Djerba, « 7am » → Hammamet, « soussa » → Sousse.
 * Composant non contrôlé vis-à-vis du formulaire (input name classique,
 * compatible GET) ; navigation clavier ↑ ↓ Entrée Échap.
 */
export function CityAutocomplete({
  name = "ville",
  defaultValue = "",
  placeholder,
  inputClassName,
  dropdownClassName = "",
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  inputClassName: string;
  dropdownClassName?: string;
}) {
  const fr = useT();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function update(next: string) {
    setValue(next);
    const results = suggestCities(next);
    setSuggestions(results);
    setOpen(results.length > 0);
    setActiveIndex(-1);
  }

  function select(city: City) {
    setValue(city.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      if (activeIndex >= 0) {
        event.preventDefault();
        select(suggestions[activeIndex]);
      } else {
        setOpen(false);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
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
        onChange={(e) => update(e.target.value)}
        onFocus={() => value && update(value)}
        onKeyDown={onKeyDown}
        className={inputClassName}
      />
      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={fr.search.suggestionsVilles}
          className={`absolute inset-x-0 top-full z-[1060] mt-2 overflow-hidden rounded-2xl bg-white py-1.5 shadow-xl ring-1 ring-darna/10 ${dropdownClassName}`}
        >
          {suggestions.map((city, index) => (
            <li key={city.name} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => {
                  // mousedown : sélectionne avant le blur de l'input.
                  e.preventDefault();
                  select(city);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm transition ${
                  index === activeIndex ? "bg-cream text-darna" : "text-ink"
                }`}
              >
                <MapPinIcon width={15} height={15} className="shrink-0 text-darna/60" />
                <span className="font-semibold">{city.name}</span>
                <span className="ml-auto text-xs text-ink/45">{city.gouvernorat}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
