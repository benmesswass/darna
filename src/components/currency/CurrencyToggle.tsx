"use client";

import { useCurrency, type Currency } from "./CurrencyProvider";

const OPTIONS: Currency[] = ["TND", "EUR"];

/** Bascule globale TND / EUR (mode diaspora) — taux statique indicatif. */
export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div
      role="group"
      aria-label="Devise"
      className="hidden items-center rounded-full bg-white/10 p-0.5 text-xs font-semibold sm:flex"
    >
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setCurrency(option)}
          aria-pressed={currency === option}
          className={
            currency === option
              ? "rounded-full bg-white px-2.5 py-1 text-darna"
              : "rounded-full px-2.5 py-1 text-white/70 hover:text-white"
          }
        >
          {option === "EUR" ? "€" : "TND"}
        </button>
      ))}
    </div>
  );
}
