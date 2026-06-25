"use client";

import { SEARCH_SORTS, type SortKey } from "@/lib/constants";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Sélecteur de tri des résultats (séjours + immo). Formulaire GET autonome qui
 * rejoue la recherche courante en changeant uniquement `tri` :
 *  • re-soumission automatique au changement (UX instantanée, sans JS lourd) ;
 *  • report des filtres courants en champs cachés (sauf `tri` et `page` — on
 *    revient page 1) → l'ordre s'applique à la recherche réelle ;
 *  • dégradation gracieuse : sans JS, un submit natif suffit (form GET).
 */
export function SortSelect({
  basePath,
  params,
  value,
  sorts = SEARCH_SORTS,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  value: SortKey;
  /** Sous-ensemble de tris à proposer (déf. tous). L'immo masque les tris par
   *  avis : ses annonces n'ont jamais d'avis (un avis exige une réservation). */
  sorts?: readonly SortKey[];
}) {
  const fr = useT();
  const label: Record<SortKey, string> = {
    recommande: fr.search.triRecommande,
    "prix-asc": fr.search.triPrixAsc,
    "prix-desc": fr.search.triPrixDesc,
    "avis-desc": fr.search.triAvisDesc,
    "avis-asc": fr.search.triAvisAsc,
    recent: fr.search.triRecent,
  };

  return (
    <form method="GET" action={basePath} className="flex items-center gap-2">
      {Object.entries(params).map(([k, v]) =>
        v && k !== "tri" && k !== "page" ? (
          <input key={k} type="hidden" name={k} value={v} />
        ) : null
      )}
      <label className="flex items-center gap-2 text-sm text-ink/60">
        <span className="font-medium">{fr.search.trier}</span>
        <select
          name="tri"
          defaultValue={value}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="rounded-xl border border-darna/15 bg-white px-3 py-1.5 text-sm font-semibold text-darna outline-none focus:border-darna"
        >
          {sorts.map((s) => (
            <option key={s} value={s}>
              {label[s]}
            </option>
          ))}
        </select>
      </label>
      {/* Filet sans JS : bouton de repli (caché quand JS dispo via le onChange). */}
      <noscript>
        <button type="submit" className="text-sm font-semibold text-darna underline">
          {fr.common.rechercher}
        </button>
      </noscript>
    </form>
  );
}
