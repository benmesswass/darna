"use client";

import { LazyMotion, domAnimation, m, MotionConfig } from "motion/react";

/**
 * Check animé (cercle qui « pop » + trait qui se dessine) — D5 de
 * DESIGN_ROADMAP.md. Réservé aux 3 moments de célébration produit :
 * réservation confirmée, annonce publiée, avis publié. Même tracé que
 * `CheckIcon` (`src/components/icons.tsx`), viewBox 24x24.
 */
export function SuccessCheck({ size = 64 }: { size?: number }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <m.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
          style={{ width: size, height: size }}
        >
          <svg
            width={size * 0.5}
            height={size * 0.5}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <m.path
              d="m5 13 4 4L19 7"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
            />
          </svg>
        </m.span>
      </MotionConfig>
    </LazyMotion>
  );
}
