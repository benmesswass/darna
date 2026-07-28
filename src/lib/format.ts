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

/** Libellé "Mois année" capitalisé — regroupement des factures par mois. */
export function formatMonthYearFr(date: Date): string {
  const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Formate un temps restant (en millisecondes) en `mm:ss` borné à zéro.
 * Sert au compte à rebours du hold de réservation (HoldCountdown). Au-delà de
 * 99 minutes on reste sur deux chiffres (cas non atteint : hold de 15 min).
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
