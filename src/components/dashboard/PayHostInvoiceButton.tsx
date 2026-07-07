"use client";

import { useActionState, useEffect } from "react";
import {
  payHostInvoiceAction,
  type HostInvoicePaymentState,
} from "@/actions/host-invoices";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Lance le paiement Konnect de la commission puis redirige vers la
 * passerelle (`payUrl`). Miroir exact de KonnectPayButton (réservation
 * voyageur), appliqué au règlement d'une HostInvoice.
 *
 * Redirection CÔTÉ CLIENT (`window.location`, pas un `redirect()` serveur) —
 * compat CSP `form-action 'self'` : le formulaire poste vers notre propre
 * origine, la navigation externe est une navigation de document.
 */
export function PayHostInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const fr = useT();
  const [state, action, pending] = useActionState<HostInvoicePaymentState, FormData>(
    payHostInvoiceAction,
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
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <button
        type="submit"
        disabled={pending || redirecting}
        className="w-full rounded-2xl bg-sand px-6 py-3.5 text-base font-bold text-darna-dark transition hover:bg-sand-light disabled:opacity-60"
      >
        {pending || redirecting ? fr.factures.redirectionKonnect : fr.factures.payerKonnect}
      </button>
    </form>
  );
}
