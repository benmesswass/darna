"use client";

import { useEffect, useRef, useState } from "react";
import { searchAddressAction, type AddressSuggestion } from "@/actions/geocode";
import { useT } from "@/components/i18n/LocaleProvider";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-darna disabled:opacity-60";

/**
 * Champ « Adresse » avec autocomplétion (Photon/OSM via `searchAddressAction`).
 * L'hôte tape une adresse, choisit une suggestion → le parent reçoit les
 * coordonnées et la ville rattachée. Le champ reste libre : une saisie sans
 * sélection est tout de même soumise (l'adresse est facultative).
 */
export function AddressAutocomplete({
  value,
  onValueChange,
  onSelect,
}: {
  value: string;
  onValueChange: (text: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
}) {
  const fr = useT();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  // Ignore les réponses obsolètes (course entre frappes successives).
  const reqId = useRef(0);
  // Ne déclenche la recherche qu'après une vraie saisie : en modification, le
  // champ est pré-rempli avec l'adresse existante, ce qui ouvrirait sinon la
  // liste automatiquement au chargement de la page.
  const userTyped = useRef(false);

  // Recherche débouncée (300 ms), à partir de 3 caractères.
  useEffect(() => {
    if (!userTyped.current) return;
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      const results = await searchAddressAction(q);
      if (id !== reqId.current) return; // réponse périmée
      setSuggestions(results);
      setSearched(true);
      setLoading(false);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  // Ferme la liste au clic à l'extérieur.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(s: AddressSuggestion) {
    onSelect(s);
    setOpen(false);
    // La sélection réécrit `value` : sans ça l'effet relancerait une recherche
    // et rouvrirait la liste juste après le choix.
    userTyped.current = false;
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        name="address"
        type="text"
        autoComplete="off"
        maxLength={200}
        value={value}
        onChange={(e) => {
          userTyped.current = true;
          onValueChange(e.target.value);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={fr.annonceForm.adresseRecherchePlaceholder}
        className={inputClass}
      />
      {open && (loading || searched) ? (
        <ul className="absolute z-[1100] mt-1 max-h-64 w-full overflow-auto rounded-xl border border-darna/15 bg-white py-1 shadow-lg">
          {loading ? (
            <li className="px-3.5 py-2 text-sm text-ink/50">
              {fr.annonceForm.rechercheAdresse}
            </li>
          ) : suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <li key={`${s.label}-${i}`}>
                <button
                  type="button"
                  onClick={() => choose(s)}
                  className="block w-full px-3.5 py-2 text-start text-sm hover:bg-darna/5"
                >
                  {s.label}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3.5 py-2 text-sm text-ink/50">
              {fr.annonceForm.aucuneAdresse}
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
