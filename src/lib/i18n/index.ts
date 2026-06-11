import { fr, type Dictionary } from "./fr";
import { en } from "./en";
import { ar } from "./ar";

export const locales = ["fr", "en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

/** Cookie lu côté serveur (layout, pages, actions) et écrit par le sélecteur de langue. */
export const LOCALE_COOKIE = "darna-locale";

/** Libellés natifs du sélecteur de langue. */
export const localeLabels: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  ar: "عربي",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

const dictionaries: Record<Locale, Dictionary> = { fr, en, ar };

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale];
}

export function getDirection(locale: Locale = defaultLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export { fr };
export type { Dictionary };
