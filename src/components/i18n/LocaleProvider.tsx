"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  defaultLocale,
  getDictionary,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";

/**
 * Le dictionnaire contient des fonctions (pluriels, interpolations) : il ne
 * peut pas traverser la frontière serveur → client. Le serveur ne transmet
 * que la locale ; chaque composant client résout son dictionnaire localement.
 */
const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Équivalent client de `getT()` — même convention : `const fr = useT();`. */
export function useT(): Dictionary {
  return getDictionary(useLocale());
}
