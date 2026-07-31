"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Remplace `whileInView` (motion) par IntersectionObserver natif —
 * ROADMAP.md §P4.1. `once: true` implicite (l'observer se déconnecte dès le
 * premier déclenchement, ne se réactive jamais). `margin` négatif = même
 * convention que motion : l'élément doit être encore un peu PLUS avancé dans
 * le viewport qu'un simple `entry.isIntersecting` brut avant de déclencher.
 */
export function useRevealOnScroll<T extends HTMLElement>(margin = "-80px") {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: `0px 0px ${margin} 0px`, threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [margin]);

  return { ref, visible };
}
