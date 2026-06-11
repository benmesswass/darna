"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { GlobeIcon } from "@/components/icons";

/** Bascule globale TND/EUR mise en scène sur la landing diaspora. */
export function DiasporaCurrencyCta() {
  const fr = useT();
  const { currency, setCurrency } = useCurrency();
  const isEur = currency === "EUR";

  return (
    <button
      type="button"
      onClick={() => setCurrency(isEur ? "TND" : "EUR")}
      aria-pressed={isEur}
      className={`inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-base font-bold transition ${
        isEur
          ? "bg-darna text-white hover:bg-darna-light"
          : "bg-sand text-darna-dark hover:bg-sand-light"
      }`}
    >
      <GlobeIcon width={20} height={20} />
      {isEur ? fr.diaspora.afficherEnTnd : fr.diaspora.afficherEnEuros}
    </button>
  );
}
