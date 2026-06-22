"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBookingAction } from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";
import { ClockIcon } from "@/components/icons";

/** Formate les millisecondes restantes en "MM:SS". */
function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Bandeau de compte à rebours sur la page paiement.
 *
 * Affiche le temps restant avant expiration du hold EN_ATTENTE (15 min).
 * Quand le délai expire, redirige automatiquement vers l'annonce après 4 s.
 * Le bouton « Annuler » appelle cancelBookingAction qui annule le hold
 * côté serveur puis redirige vers l'annonce.
 */
export function BookingCountdown({
  bookingId,
  expiresAt,
  propertySlug,
}: {
  bookingId: string;
  /** ISO string de booking.expiresAt (sérialisé par Next.js depuis le Server Component). */
  expiresAt: string;
  propertySlug: string;
}) {
  const fr = useT();
  const router = useRouter();

  const expireMs = useRef(new Date(expiresAt).getTime());

  const [remaining, setRemaining] = useState(() =>
    expireMs.current - Date.now()
  );
  const expired = remaining <= 0;

  useEffect(() => {
    if (expired) return;

    const tick = () => {
      const r = expireMs.current - Date.now();
      setRemaining(r);
      if (r <= 0) clearInterval(id);
    };

    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [expired]);

  // Redirection automatique 4 s après expiration.
  useEffect(() => {
    if (!expired) return;
    const t = setTimeout(() => router.push(`/annonce/${propertySlug}`), 4000);
    return () => clearTimeout(t);
  }, [expired, propertySlug, router]);

  if (expired) {
    return (
      <div
        role="alert"
        className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 px-5 py-4 ring-1 ring-red-200"
      >
        <ClockIcon width={18} height={18} className="mt-0.5 shrink-0 text-red-500" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-red-700">{fr.booking.holdExpire}</p>
          <p className="mt-0.5 text-red-500/80">
            {formatRemaining(0)} — {fr.common.chargement}…
          </p>
        </div>
      </div>
    );
  }

  const urgent = remaining < 3 * 60 * 1000; // moins de 3 min → rouge

  return (
    <div
      className={`mb-6 flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5 ring-1 ${
        urgent
          ? "bg-red-50 ring-red-200"
          : "bg-amber-50 ring-amber-200"
      }`}
    >
      <span
        className={`flex items-center gap-2 text-sm font-semibold ${
          urgent ? "text-red-700" : "text-amber-800"
        }`}
      >
        <ClockIcon
          width={16}
          height={16}
          className={urgent ? "text-red-500" : "text-amber-500"}
        />
        {fr.booking.holdTimer(formatRemaining(remaining))}
      </span>

      <form action={cancelBookingAction}>
        <input type="hidden" name="bookingId" value={bookingId} />
        <button
          type="submit"
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
            urgent
              ? "text-red-600 hover:bg-red-100"
              : "text-amber-700 hover:bg-amber-100"
          }`}
        >
          {fr.booking.annulerRetenue}
        </button>
      </form>
    </div>
  );
}
