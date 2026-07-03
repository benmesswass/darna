"use client";

/**
 * Case à cocher de filtre qui re-soumet automatiquement son formulaire de
 * recherche au changement (pas besoin de recliquer « Rechercher »). Form GET →
 * dégradation gracieuse sans JS (le bouton submit reste fonctionnel).
 */
export function AutoSubmitCheckbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-body/70">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={defaultChecked}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-4 w-4 accent-darna"
      />
      {label}
    </label>
  );
}
