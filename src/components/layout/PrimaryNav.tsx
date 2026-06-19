"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useSectionOverride } from "./ActiveSection";

type Item = { href: string; label: string };

// useLayoutEffect émet un warning au SSR : on retombe sur useEffect côté serveur.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Navigation principale (Séjours / Immobilier) avec une pastille qui glisse
 * sous le lien actif. La position/largeur sont mesurées sur le lien actif puis
 * appliquées en transform (perf), animées via `.nav-pill` (globals.css).
 * Pur CSS + mesure JS, aucune librairie d'animation.
 */
export function PrimaryNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const override = useSectionOverride();
  // La route gagne ; sinon on suit la verticale déclarée par la page
  // (`<ActiveSection>`) afin que la pastille reste sur les pages hors-route
  // (`/annonce/[slug]`, réservation, paiement). Override = href sans slash.
  const byPath = items.findIndex(
    (it) => pathname === it.href || pathname.startsWith(`${it.href}/`),
  );
  const activeIndex =
    byPath >= 0
      ? byPath
      : override
        ? items.findIndex((it) => it.href === `/${override}`)
        : -1;

  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  // Pas d'animation au tout premier rendu : on n'active `.nav-pill` qu'après le montage.
  const [mounted, setMounted] = useState(false);

  const measure = () => {
    const el = activeIndex >= 0 ? itemRefs.current[activeIndex] : null;
    setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  };

  // Mesure avant peinture pour éviter tout flash de position.
  useIsoLayoutEffect(measure, [activeIndex, items]);

  useEffect(() => setMounted(true), []);

  // Recalcule si la largeur change (resize, police chargée, bascule LTR/RTL).
  useEffect(() => {
    const node = navRef.current;
    if (!node) return;
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // Sur l'accueil, le hero porte déjà le choix de verticale (onglets Séjours /
  // Immobilier) : on masque la pastille du header pour éviter le doublon. Elle
  // réapparaît sur toutes les autres pages comme navigation entre verticales.
  if (pathname === "/") return null;

  return (
    <nav
      ref={navRef}
      className="relative hidden items-center rounded-full bg-white/10 p-1 md:flex"
    >
      {/* Pastille glissante : positionnée via translateX(offsetLeft) — `left: 0`
          physique volontaire, offsetLeft est déjà correct en LTR comme en RTL. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1 bottom-1 rounded-full bg-[var(--color-accent)] shadow-sm ${
          mounted ? "nav-pill" : ""
        }`}
        style={{
          left: 0,
          width: pill?.width ?? 0,
          transform: `translateX(${pill?.left ?? 0}px)`,
          opacity: pill ? 1 : 0,
        }}
      />
      {items.map((item, i) => {
        const active = i === activeIndex;
        return (
          <Link
            key={item.href}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? "text-[var(--color-accent-contrast)]"
                : "text-white/90 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
