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
  paymentMode = "ESCROW",
  discountToken,
  useCredits,
}: {
  slug: string;
  arrivee: string;
  depart: string;
  voyageurs: number;
  /** Rail 2 (PSP3) : "SUR_PLACE" envoie une demande d'acceptation, pas un paiement. */
  paymentMode?: "ESCROW" | "SUR_PLACE";
  /** Réduction ponctuelle (§AH4), déjà validée pour l'affichage — revérifiée
   * et consommée atomiquement côté serveur (createBookingAction). */
  discountToken?: string;
  /** Crédit (§CR1) — déjà prévisualisé par le devis ; réappliqué et dépensé
   * atomiquement côté serveur (createBookingAction), jamais confiance ici. */
  useCredits?: boolean;
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
      <input type="hidden" name="paymentMode" value={paymentMode} />
      {discountToken ? (
        <input type="hidden" name="discountToken" value={discountToken} />
      ) : null}
      <input type="hidden" name="useCredits" value={useCredits ? "true" : "false"} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-sand px-6 py-3.5 text-base font-bold text-darna-dark transition hover:bg-sand-light disabled:opacity-60"
      >
        {pending
          ? fr.common.chargement
          : paymentMode === "SUR_PLACE"
            ? fr.booking.continuerDemandeCash
            : fr.booking.continuerPaiement}
      </button>
    </form>
  );
}
