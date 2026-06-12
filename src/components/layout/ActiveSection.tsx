"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Nom de section = clé d'accent (globals.css) ET href sans slash (`/sejours`). */
export type SectionName = "sejours" | "immobilier";

type Ctx = {
  override: SectionName | null;
  setOverride: (section: SectionName | null) => void;
};

const SectionOverrideContext = createContext<Ctx | null>(null);

/**
 * Fournit l'« override » de section actif à toute la plateforme. La nav
 * principale et le thème de section (`PrimaryNav`, `SectionTheme`) vivent dans
 * le layout, donc *au-dessus* des pages : ils ne peuvent pas recevoir de props
 * d'une page. Ce contexte laisse une page (ex. une annonce, dont l'URL
 * `/annonce/…` ne porte pas la verticale) déclarer sa section via
 * `<ActiveSection>`, que les deux consommateurs lisent en repli de la route.
 */
export function SectionOverrideProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<SectionName | null>(null);
  // setOverride (dispatch useState) est stable ; on ne recrée la valeur que
  // quand `override` change, pour ne re-rendre les consommateurs qu'à ce
  // moment-là.
  const value = useMemo(() => ({ override, setOverride }), [override]);
  return (
    <SectionOverrideContext.Provider value={value}>
      {children}
    </SectionOverrideContext.Provider>
  );
}

/** Section déclarée par la page courante (null si aucune). */
export function useSectionOverride(): SectionName | null {
  return useContext(SectionOverrideContext)?.override ?? null;
}

/**
 * Déclare la verticale de la page courante quand la route ne la porte pas
 * (`/annonce/[slug]`, `/annonce/[slug]/reserver`, `/reservation/[id]/paiement`).
 * La nav reste en surbrillance et l'accent de section est conservé tant qu'on
 * est sur la page. Ne rend rien : effet de bord uniquement.
 */
export function ActiveSection({ name }: { name: SectionName }) {
  // On ne dépend que du setter (référence stable), pas de l'objet contexte
  // (recréé à chaque changement d'override) — sinon l'effet bouclerait.
  const setOverride = useContext(SectionOverrideContext)?.setOverride;
  useEffect(() => {
    setOverride?.(name);
    return () => setOverride?.(null);
  }, [setOverride, name]);
  return null;
}
