"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, locales, localeLabels, type Locale } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

/**
 * Sélecteur de langue — même langage visuel que CurrencyToggle, mais persiste
 * en cookie (et non localStorage) car le rendu serveur dépend de la locale.
 * Toujours visible, y compris sur mobile : changer de langue est un besoin
 * de premier niveau pour un site trilingue.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label="Langue / Language / اللغة"
      className={`flex items-center rounded-full bg-white/10 p-0.5 text-xs font-semibold ${
        pending ? "opacity-60" : ""
      }`}
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          onClick={() => switchTo(l)}
          aria-pressed={l === locale}
          className={`rounded-full px-2.5 py-1 transition ${
            l === locale
              ? "bg-white text-darna"
              : "text-white/80 hover:text-white"
          }`}
        >
          {localeLabels[l]}
        </button>
      ))}
    </div>
  );
}
