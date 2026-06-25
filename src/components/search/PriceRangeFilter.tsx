"use client";

import { useState } from "react";
import { Price } from "@/components/currency/Price";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Champ de filtre prix séjour (min–max fusionnés dans un seul cadre) + retour
 * EN DIRECT : si des dates sont sélectionnées, on traduit la fourchette « par
 * nuit » en coût TOTAL du séjour (tout compris, frais de service inclus —
 * cohérent avec le total affiché sur les cartes). Met à jour à la frappe.
 *
 * Reste un champ de formulaire GET classique (name=prixMin/prixMax) : la
 * soumission se fait au clic « Rechercher », comme avant.
 */
export function PriceRangeFilter({
  defaultMin,
  defaultMax,
  nights,
  feeRate,
}: {
  defaultMin?: string;
  defaultMax?: string;
  /** Nombre de nuits cherché (0 = pas de dates → pas d'équivalent affiché). */
  nights: number;
  /** Taux de frais de service (SERVICE_FEE_RATE), passé par le serveur. */
  feeRate: number;
}) {
  const fr = useT();
  const [min, setMin] = useState(defaultMin ?? "");
  const [max, setMax] = useState(defaultMax ?? "");

  /** Total tout compris pour un prix/nuit donné (même calcul que la réservation). */
  const allIn = (perNight: number) =>
    perNight * nights + Math.round(perNight * nights * feeRate);

  const minN = Number(min) > 0 ? Number(min) : null;
  const maxN = Number(max) > 0 ? Number(max) : null;
  const showEquiv = nights > 0 && (minN !== null || maxN !== null);

  const inputClass =
    "w-16 bg-transparent text-sm outline-none placeholder:text-ink/30";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 rounded-xl border border-darna/15 bg-cream px-3 py-2 focus-within:border-darna">
        <span className="whitespace-nowrap text-xs font-semibold text-ink/50">
          {fr.search.prix} {fr.common.parNuit} ({fr.common.tnd})
        </span>
        <input
          type="number"
          name="prixMin"
          min={0}
          step={10}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          placeholder={fr.search.min}
          aria-label={`${fr.search.prixMin} (${fr.common.tnd})`}
          className={inputClass}
        />
        <span aria-hidden className="text-ink/30">–</span>
        <input
          type="number"
          name="prixMax"
          min={0}
          step={10}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          placeholder={fr.search.max}
          aria-label={`${fr.search.prixMax} (${fr.common.tnd})`}
          className={inputClass}
        />
      </div>

      {showEquiv ? (
        <p className="text-xs text-ink/50">
          {fr.search.equivSejour(nights)}{" "}
          {minN !== null && maxN !== null ? (
            <span className="font-semibold text-ink/70">
              <Price amount={allIn(minN)} /> – <Price amount={allIn(maxN)} />
            </span>
          ) : minN !== null ? (
            <span className="font-semibold text-ink/70">
              ≥ <Price amount={allIn(minN)} />
            </span>
          ) : (
            <span className="font-semibold text-ink/70">
              ≤ <Price amount={allIn(maxN!)} />
            </span>
          )}
        </p>
      ) : null}
    </div>
  );
}
