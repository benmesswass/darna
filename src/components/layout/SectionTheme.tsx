"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSectionOverride } from "./ActiveSection";

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
 *
 * La route gagne ; en repli, on suit l'override déclaré par la page
 * (`<ActiveSection>`) pour les pages hors-route comme `/annonce/[slug]`.
 */
export function SectionTheme() {
  const pathname = usePathname();
  const override = useSectionOverride();

  useEffect(() => {
    const match = SECTIONS.find(
      ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    const section = match ? match[1] : override;
    const root = document.documentElement;
    if (section) {
      root.dataset.section = section;
    } else {
      delete root.dataset.section;
    }
  }, [pathname, override]);

  return null;
}
