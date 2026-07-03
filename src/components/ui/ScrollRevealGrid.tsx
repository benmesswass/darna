"use client";

import { Children, type ReactNode } from "react";
import { LazyMotion, domAnimation, m, MotionConfig, type Variants } from "motion/react";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/**
 * Grille avec fade + slide en cascade déclenché au scroll (D11 de
 * DESIGN_ROADMAP.md) — même mécanique que `AnimatedGrid` (D2), mais
 * `whileInView` au lieu de `animate` : pertinent pour des sections statiques
 * sous le pli (pas de re-render sur changement de filtre/page ici, donc pas
 * besoin de `key` dynamique côté appelant). `once: true` : l'anim ne se
 * rejoue pas si l'utilisateur remonte/redescend.
 */
export function ScrollRevealGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <m.div
          className={className}
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
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
