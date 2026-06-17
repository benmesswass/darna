import type { ReactNode } from "react";

/**
 * Caractéristique unitaire d'une fiche (icône + libellé), partagée par le
 * noyau (surface, pièces) et les verticales (ex. capacité côté séjour).
 */
export function Caracteristique({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-ink/80 ring-1 ring-darna/10">
      <span className="text-darna">{icon}</span>
      {label}
    </div>
  );
}
