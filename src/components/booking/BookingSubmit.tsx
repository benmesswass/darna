"use client";

import { useActionState } from "react";
import { createBookingAction, type BookingFormState } from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";

/** Soumission de la demande de réservation (les montants restent serveur). */
export function BookingSubmit({
  slug,
  arrivee,
  depart,
  voyageurs,
}: {
  slug: string;
  arrivee: string;
  depart: string;
  voyageurs: number;
}) {
  const fr = useT();
  const [state, action, pending] = useActionState<BookingFormState, FormData>(
    createBookingAction,
    undefined
  );

  return (
    <form action={action} className="mt-5">
      {state?.error ? (
        <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="arrivee" value={arrivee} />
      <input type="hidden" name="depart" value={depart} />
      <input type="hidden" name="voyageurs" value={voyageurs} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-sand px-6 py-3.5 text-base font-bold text-darna-dark transition hover:bg-sand-light disabled:opacity-60"
      >
        {pending ? fr.common.chargement : fr.booking.continuerPaiement}
      </button>
    </form>
  );
}
