"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { normalizeSearch } from "@/lib/geo";
import { MapPinIcon } from "@/components/icons";

/**
 * Champ gouvernorat (région) avec liste déroulante — même look/feel que
 * `CityAutocomplete` :
 * - au focus / clic, la liste s'ouvre sur **tous** les gouvernorats ;
 * - dès que l'on tape, le filtre s'applique (insensible aux accents :
 *   « medenine » → Médenine, « gab » → Gabès) ;
 * - sélection souris ou clavier (↑ ↓ Entrée Échap) ;
 * - champ vide = aucun filtre (tous les gouvernorats).
 *
 * Non contrôlé vis-à-vis du formulaire (input `name` classique, compatible GET).
 */
export function GouvernoratAutocomplete({
  options,
  name = "gouvernorat",
  defaultValue = "",
  placeholder,
  inputClassName,
  dropdownClassName = "",
}: {
  /** Liste des gouvernorats proposés (source unique : `GOUVERNORATS`). */
  options: readonly string[];
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
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const sorted = useMemo(
    () => [...options].sort((a, b) => a.localeCompare(b, "fr")),
    [options]
  );

  // Liste affichée : tous les gouvernorats si le champ est vide, sinon le
  // filtre (préfixes d'abord, puis sous-chaînes).
  const suggestions = useMemo<string[]>(() => {
    const q = normalizeSearch(value);
    if (!q) return sorted;
    const starts = sorted.filter((g) => normalizeSearch(g).startsWith(q));
    const contains = sorted.filter(
      (g) => !normalizeSearch(g).startsWith(q) && normalizeSearch(g).includes(q)
    );
    return [...starts, ...contains];
  }, [value, sorted]);

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

  function select(g: string) {
    setValue(g);
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
          aria-label={fr.search.suggestionsGouvernorats}
          className={`absolute inset-x-0 top-full z-[1060] mt-2 max-h-72 overflow-y-auto overflow-x-hidden rounded-2xl bg-white py-1.5 shadow-xl ring-1 ring-darna/10 ${dropdownClassName}`}
        >
          {suggestions.map((g, index) => (
            <li key={g} role="option" aria-selected={index === activeIndex}>
              <button
                ref={index === activeIndex ? activeRef : null}
                type="button"
                onMouseDown={(e) => {
                  // mousedown : sélectionne avant le blur de l'input.
                  e.preventDefault();
                  select(g);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm transition ${
                  index === activeIndex ? "bg-cream text-darna" : "text-ink"
                }`}
              >
                <MapPinIcon width={15} height={15} className="shrink-0 text-darna/60" />
                <span className="font-semibold">{g}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
