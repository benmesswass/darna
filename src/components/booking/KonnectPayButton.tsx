"use client";

import { useActionState, useEffect } from "react";
import {
  startKonnectPaymentAction,
  type PaymentFormState,
} from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Lance le paiement Konnect puis redirige vers la passerelle (`payUrl`).
 * Montant = les frais Darna, toujours déterminé côté serveur (§L5.1) — aucun
 * montant transmis par le client.
 *
 * La redirection est faite côté client via `window.location` — et non par un
 * `redirect()` serveur — pour rester compatible avec la CSP `form-action 'self'`
 * du middleware : le formulaire poste vers notre propre origine, et la
 * navigation externe est une navigation de document, pas une soumission de form.
 */
export function KonnectPayButton({ bookingId }: { bookingId: string }) {
  const fr = useT();
  const [state, action, pending] = useActionState<PaymentFormState, FormData>(
    startKonnectPaymentAction,
    undefined
  );

  useEffect(() => {
    if (state?.payUrl) window.location.href = state.payUrl;
  }, [state?.payUrl]);

  // payUrl reçu : on part vers Konnect — afficher l'état de redirection.
  const redirecting = Boolean(state?.payUrl);

  return (
    <form action={action} className="mt-5">
      {state?.error ? (
        <p
          role="alert"
          className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
        >
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="bookingId" value={bookingId} />
      <button
        type="submit"
        disabled={pending || redirecting}
        className="w-full rounded-2xl bg-sand px-6 py-3.5 text-base font-bold text-darna-dark transition hover:bg-sand-light disabled:opacity-60"
      >
        {pending || redirecting
          ? fr.booking.redirectionKonnect
          : fr.booking.payerKonnect}
      </button>
    </form>
  );
}
