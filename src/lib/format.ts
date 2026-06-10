/** Formatage serveur (marqueurs carte, récapitulatifs, contrat). */

export function formatTndServer(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} TND`;
}

/** Libellé compact pour les marqueurs prix de la carte. */
export function markerPriceLabel(price: number, type: string): string {
  if (type === "VENTE") {
    return price >= 1_000_000
      ? `${(price / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M TND`
      : `${Math.round(price / 1000)} k TND`;
  }
  return formatTndServer(price);
}

export function formatDateFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateShortFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
