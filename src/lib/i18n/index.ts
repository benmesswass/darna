import { fr, type Dictionary } from "./fr";

/**
 * Locales supportées. L'arabe (`ar`) sera ajouté avec son dictionnaire
 * `ar.ts` (même structure que `fr.ts`) et `dir="rtl"` appliqué dans le layout.
 */
export const locales = ["fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

const dictionaries: Record<Locale, Dictionary> = { fr };

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale];
}

export function getDirection(locale: Locale = defaultLocale): "ltr" | "rtl" {
  // L'arabe basculera en "rtl".
  return locale === ("ar" as string) ? "rtl" : "ltr";
}

export { fr };
export type { Dictionary };
