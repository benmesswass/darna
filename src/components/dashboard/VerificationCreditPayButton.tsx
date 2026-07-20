"use client";

import { useActionState, useEffect } from "react";
import {
  startVerificationCreditPaymentAction,
  type VerificationCreditPaymentState,
} from "@/actions/verification-credits";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Lance le paiement Konnect d'un lot de crédits de vérification Wakil puis
 * redirige vers la passerelle (`payUrl`). Miroir exact de
 * SubscriptionPayButton/FeaturedPayButton.
 *
 * Redirection CÔTÉ CLIENT (`window.location`, pas un `redirect()` serveur) —
 * compat CSP `form-action 'self'`.
 */
export function VerificationCreditPayButton({ pack, label }: { pack: string; label: string }) {
  const fr = useT();
  const [state, action, pending] = useActionState<VerificationCreditPaymentState, FormData>(
    startVerificationCreditPaymentAction,
    undefined
  );

  useEffect(() => {
    if (state?.payUrl) window.location.href = state.payUrl;
  }, [state?.payUrl]);

  const redirecting = Boolean(state?.payUrl);

  return (
    <form action={action} className="mt-4">
      {state?.error ? (
        <p
          role="alert"
          className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
        >
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="pack" value={pack} />
      <button
        type="submit"
        disabled={pending || redirecting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-bold text-darna-dark transition hover:bg-amber-300 disabled:opacity-60"
      >
        {pending || redirecting ? fr.abonnement.redirectionKonnect : label}
      </button>
    </form>
  );
}
