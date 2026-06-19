"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import { BookingDatePicker } from "@/components/booking/BookingDatePicker";

/**
 * Sélecteur de dates INTERACTIF sur la fiche séjour (remplace l'ancien
 * calendrier figé en lecture seule). On choisit arrivée + départ dans un seul
 * calendrier moderne, puis « Réserver » emporte les dates vers le funnel de
 * réservation (/reserver les pré-remplit). Le prix/devis reste calculé là-bas.
 */
export function StayDatesPicker({
  slug,
  unavailable,
  active,
}: {
  slug: string;
  unavailable: string[];
  active: boolean;
}) {
  const fr = useT();
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const ready = Boolean(checkIn && checkOut);

  const href = ready
    ? `/annonce/${slug}/reserver?arrivee=${checkIn}&depart=${checkOut}`
    : `/annonce/${slug}/reserver`;

  return (
    <div className="space-y-4">
      <BookingDatePicker
        unavailable={unavailable}
        checkIn={checkIn}
        checkOut={checkOut}
        onChange={(ci, co) => {
          setCheckIn(ci);
          setCheckOut(co);
        }}
      />
      {active ? (
        <Link
          href={href}
          aria-disabled={!ready}
          tabIndex={ready ? undefined : -1}
          className={`block rounded-2xl px-5 py-3.5 text-center text-base font-bold transition ${
            ready
              ? "bg-sand text-darna-dark hover:bg-sand-light"
              : "pointer-events-none bg-darna/20 text-white"
          }`}
        >
          {ready ? fr.property.reserver : fr.booking.selectionnezDates}
        </Link>
      ) : null}
    </div>
  );
}
