"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Préfixe de route → nom de section (= clé d'accent dans globals.css). */
const SECTIONS: ReadonlyArray<readonly [string, string]> = [
  ["/sejours", "sejours"],
  ["/immobilier", "immobilier"],
];

/**
 * Pose `data-section` sur <html> selon la route courante, ce qui bascule
 * l'accent de couleur de toute la plateforme (voir globals.css). Le morphing
 * est animé par les éléments qui portent `.accent-transition` / `.nav-pill`.
 * Rien à rendre : effet de bord uniquement.
 */
export function SectionTheme() {
  const pathname = usePathname();

  useEffect(() => {
    const match = SECTIONS.find(
      ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    const root = document.documentElement;
    if (match) {
      root.dataset.section = match[1];
    } else {
      delete root.dataset.section;
    }
  }, [pathname]);

  return null;
}
