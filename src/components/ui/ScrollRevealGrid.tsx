"use client";

import { Children, type ReactNode } from "react";
import { useRevealOnScroll } from "./useRevealOnScroll";

/**
 * Grille avec fade + slide en cascade déclenché au scroll (D11 de
 * DESIGN_ROADMAP.md) — même mécanique que `AnimatedGrid` (D2), mais
 * déclenchée au scroll (IntersectionObserver, `useRevealOnScroll`) au lieu
 * du montage : pertinent pour des sections statiques sous le pli. Ne se
 * rejoue pas si l'utilisateur remonte/redescend (once implicite dans le
 * hook). CSS pur (ROADMAP.md §P4.1, remplace `motion`).
 */
export function ScrollRevealGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>("-100px");

  return (
    <div ref={ref} className={className}>
      {Children.toArray(children).map((child, i) => (
        <div
          key={(child as { key?: string | null }).key}
          className={visible ? "darna-fade-up" : "opacity-0"}
          style={visible ? { animationDelay: `${i * 80}ms` } : undefined}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
