"use client";

import { Children, type ReactNode } from "react";
import { LazyMotion, domAnimation, m, MotionConfig, type Variants } from "motion/react";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

/**
 * Grille avec fade + slide en cascade au montage (D2 de DESIGN_ROADMAP.md).
 * `key` doit être passé par l'appelant (dérivé du contenu affiché, ex. les
 * ids des résultats) pour rejouer l'animation à chaque changement de page ou
 * de filtre — sans ça React réutilise l'instance et l'anim ne se rejoue pas.
 * `reducedMotion="user"` fait respecter `prefers-reduced-motion` (déjà la
 * convention du site, voir `.nav-pill` dans globals.css).
 */
export function AnimatedGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <m.div className={className} variants={container} initial="hidden" animate="show">
          {Children.toArray(children).map((child) => (
            <m.div key={(child as { key?: string | null }).key} variants={item}>
              {child}
            </m.div>
          ))}
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}
