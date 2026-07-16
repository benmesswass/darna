"use client";

import { useActionState, useEffect } from "react";
import {
  startFeaturedOrderPaymentAction,
  type FeaturedOrderPaymentState,
} from "@/actions/properties";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Lance le paiement Konnect de la mise à la une puis redirige vers la
 * passerelle (`payUrl`). Miroir exact de PayHostInvoiceButton/KonnectPayButton.
 *
 * Redirection CÔTÉ CLIENT (`window.location`, pas un `redirect()` serveur) —
 * compat CSP `form-action 'self'` : le formulaire poste vers notre propre
 * origine, la navigation externe est une navigation de document.
 */
export function FeaturedPayButton({ propertyId }: { propertyId: string }) {
  const fr = useT();
  const [state, action, pending] = useActionState<FeaturedOrderPaymentState, FormData>(
    startFeaturedOrderPaymentAction,
    undefined
  );

  useEffect(() => {
    if (state?.payUrl) window.location.href = state.payUrl;
  }, [state?.payUrl]);

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
      <input type="hidden" name="propertyId" value={propertyId} />
      <button
        type="submit"
        disabled={pending || redirecting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-base font-bold text-darna-dark transition hover:bg-amber-300 disabled:opacity-60"
      >
        {pending || redirecting ? fr.alaUne.redirectionKonnect : fr.alaUne.payerKonnect}
      </button>
    </form>
  );
}
