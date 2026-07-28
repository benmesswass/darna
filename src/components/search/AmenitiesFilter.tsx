"use client";

import { AMENITIES } from "@/lib/constants";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Cases à cocher « équipements » (pills), re-soumission auto au changement
 * (même idiome que AutoSubmitCheckbox). Libellés en français tel quels — ce
 * sont des données métier stockées en base, pas des clés i18n.
 */
export function AmenitiesFilter({ selected }: { selected: string[] }) {
  const fr = useT();
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-xs font-semibold text-muted">
        {fr.search.equipements}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {AMENITIES.map((a) => (
          <label
            key={a}
            className="flex cursor-pointer items-center gap-1 rounded-full bg-cream px-3 py-1.5 text-xs font-medium ring-1 ring-darna/15 has-[:checked]:bg-darna has-[:checked]:text-white"
          >
            <input
              type="checkbox"
              name="equipements"
              value={a}
              defaultChecked={selected.includes(a)}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="sr-only"
            />
            {a}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
