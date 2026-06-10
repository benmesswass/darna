"use client";

import { EUR_TO_TND } from "@/lib/config";
import { useCurrency } from "./CurrencyProvider";

export function formatTnd(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} TND`;
}

export function formatEur(amountTnd: number): string {
  const eur = Math.round(amountTnd / EUR_TO_TND);
  return `≈ ${new Intl.NumberFormat("fr-FR").format(eur)} €`;
}

/**
 * Affiche un montant TND, converti en EUR si le mode diaspora est actif.
 * `suffix` : « / nuit », « / mois »…
 */
export function Price({
  amount,
  suffix,
  className,
}: {
  amount: number;
  suffix?: string;
  className?: string;
}) {
  const { currency } = useCurrency();
  const label = currency === "EUR" ? formatEur(amount) : formatTnd(amount);

  return (
    <span className={className}>
      {label}
      {suffix ? (
        <span className="text-[0.78em] font-normal opacity-70"> {suffix}</span>
      ) : null}
    </span>
  );
}
