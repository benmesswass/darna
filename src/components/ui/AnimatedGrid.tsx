import { Children, type ReactNode } from "react";

/**
 * Grille avec fade + slide en cascade au montage (D2 de DESIGN_ROADMAP.md).
 * `key` doit être passé par l'appelant (dérivé du contenu affiché, ex. les
 * ids des résultats) pour rejouer l'animation à chaque changement de page ou
 * de filtre — sans ça React réutilise l'instance et l'anim ne se rejoue pas.
 * CSS pur (ROADMAP.md §P4.1, remplace `motion`) : `.darna-fade-up`
 * (globals.css) respecte `prefers-reduced-motion` nativement.
 */
export function AnimatedGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {Children.toArray(children).map((child, i) => (
        <div
          key={(child as { key?: string | null }).key}
          className="darna-fade-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
