"use client";

import { useActionState, useEffect } from "react";
import {
  startHostVerificationPaymentAction,
  type HostVerificationPaymentState,
} from "@/actions/host-verification-payments";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Lance le paiement Konnect de la vérification Wakil (HOTE, à l'unité) puis
 * redirige vers la passerelle (`payUrl`). Miroir exact de
 * VerificationCreditPayButton/SubscriptionPayButton — sans champ caché
 * (toujours exactement 1 crédit, aucune sélection à faire).
 *
 * Redirection CÔTÉ CLIENT (`window.location`, pas un `redirect()` serveur) —
 * compat CSP `form-action 'self'`.
 */
export function HostVerificationPayButton({ label }: { label: string }) {
  const fr = useT();
  const [state, action, pending] = useActionState<HostVerificationPaymentState, FormData>(
    startHostVerificationPaymentAction,
    undefined
  );

  useEffect(() => {
    if (state?.payUrl) window.location.href = state.payUrl;
  }, [state?.payUrl]);

  const redirecting = Boolean(state?.payUrl);

  return (
    <form action={action}>
      {state?.error ? (
        <p role="alert" className="mb-1.5 text-xs font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || redirecting}
        className="w-full rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-darna-dark transition hover:bg-amber-300 disabled:opacity-60"
      >
        {pending || redirecting ? fr.abonnement.redirectionKonnect : label}
      </button>
    </form>
  );
}
