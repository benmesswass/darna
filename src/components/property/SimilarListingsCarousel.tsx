"use client";

import { Children, useRef, type ReactNode } from "react";
import { useRevealOnScroll } from "@/components/ui/useRevealOnScroll";
import { ChevronLeftIcon } from "@/components/icons";

/**
 * Carrousel horizontal (D8 de DESIGN_ROADMAP.md) : défilement natif au doigt/
 * trackpad (`scroll-snap`), boutons précédent/suivant en plus sur desktop.
 * Pas de lib de carrousel externe — CSS scroll-snap suffit pour une poignée
 * de cartes, cohérent avec « zéro librairie UI lourde ». Fade-in au scroll
 * en CSS pur (ROADMAP.md §P4.1, remplace `motion` — `useRevealOnScroll`).
 */
export function SimilarListingsCarousel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { ref: revealRef, visible } = useRevealOnScroll<HTMLDivElement>("-80px");

  function scrollByCard(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-carousel-item]");
    const amount = (card?.offsetWidth ?? 280) + 20; // largeur carte + gap-5
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <div
      ref={revealRef}
      className={`relative ${visible ? "darna-fade-up" : "opacity-0"} ${className}`}
    >
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Children.toArray(children).map((child) => (
          <div
            key={(child as { key?: string | null }).key}
            data-carousel-item
            className="w-[75%] shrink-0 snap-start sm:w-[300px]"
          >
            {child}
          </div>
        ))}
      </div>

      {/* Navigation : masquée sur mobile (le défilement tactile suffit). */}
      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        aria-label="Précédent"
        className="absolute start-0 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface p-2 text-heading shadow-md ring-1 ring-darna/10 transition hover:bg-cream sm:flex"
      >
        <ChevronLeftIcon width={18} height={18} />
      </button>
      <button
        type="button"
        onClick={() => scrollByCard(1)}
        aria-label="Suivant"
        className="absolute end-0 top-1/2 hidden translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface p-2 text-heading shadow-md ring-1 ring-darna/10 transition hover:bg-cream sm:flex"
      >
        <ChevronLeftIcon width={18} height={18} className="rotate-180" />
      </button>
    </div>
  );
}
