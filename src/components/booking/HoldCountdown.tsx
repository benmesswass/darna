"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCountdown } from "@/lib/format";
import { useT } from "@/components/i18n/LocaleProvider";
import { ClockIcon } from "@/components/icons";

/**
 * Compte à rebours du hold de réservation (15 min, cf. BOOKING_EXPIRY_MS).
 * Réduit l'anxiété (« ma place est gardée ») ET crée l'urgence de payer — deux
 * leviers de conversion. Quand le délai expire, on bascule sur un message clair
 * + un lien pour relancer la réservation (les dates ont été libérées côté
 * serveur), plutôt que de laisser le paiement échouer sans explication.
 *
 * Purement client : aucune donnée sensible, juste l'échéance ISO du hold.
 */
export function HoldCountdown({
  expiresAt,
  slug,
}: {
  /** Échéance du hold (ISO). */
  expiresAt: string;
  /** Slug de l'annonce, pour relancer une réservation si le hold a expiré. */
  slug: string;
}) {
  const fr = useT();
  const target = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    // Recale immédiatement (le state initial peut dater du rendu serveur), puis
    // tick chaque seconde. On s'arrête net une fois à zéro.
    setRemaining(target - Date.now());
    const id = setInterval(() => {
      const left = target - Date.now();
      setRemaining(left);
      if (left <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  // Échéance invalide : ne rien afficher (sécurité — ne jamais casser la page).
  if (Number.isNaN(target)) return null;

  // Hold expiré : les dates sont libérées → on propose de recommencer.
  if (remaining <= 0) {
    return (
      <div
        role="alert"
        className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm"
      >
        <p className="font-bold text-red-700">{fr.booking.holdExpireTitre}</p>
        <p className="mt-1 text-red-700/80">{fr.booking.holdExpireDetail}</p>
        <Link
          href={`/annonce/${slug}/reserver`}
          className="mt-3 inline-block rounded-full bg-darna px-5 py-2 text-sm font-bold text-white hover:bg-darna-light"
        >
          {fr.booking.holdExpireCta}
        </Link>
      </div>
    );
  }

  // < 2 min : on accentue l'urgence (couleur ambre).
  const urgent = remaining <= 2 * 60 * 1000;

  return (
    <p
      role="status"
      aria-live="off"
      className={`mt-5 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
        urgent ? "bg-amber-100 text-amber-800" : "bg-cream text-heading"
      }`}
    >
      <ClockIcon width={16} height={16} className="shrink-0" />
      {fr.booking.holdLabel}
      <span className="font-mono text-base tabular-nums">
        {formatCountdown(remaining)}
      </span>
    </p>
  );
}
