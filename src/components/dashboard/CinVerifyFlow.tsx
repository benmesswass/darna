"use client";

import { useActionState, useEffect } from "react";
import { submitCinAction, type KycFormState } from "@/actions/kyc";
import { useT } from "@/components/i18n/LocaleProvider";

const fieldBase =
  "rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-darna";

/**
 * Étape « CIN » : pièce d'identité. Le numéro est unique inter-comptes (cf.
 * submitCinAction). Réservée aux hôtes/agences dans l'assistant.
 */
export function CinVerifyFlow({
  initialStatus,
  onVerified,
}: {
  initialStatus: string;
  onVerified?: () => void;
}) {
  const fr = useT();
  const [state, action, pending] = useActionState<KycFormState, FormData>(
    submitCinAction,
    undefined
  );

  const demoVerified = initialStatus === "DEMO_VERIFIE" || state?.demo;
  const verified =
    initialStatus === "VERIFIE" || initialStatus === "DEMO_VERIFIE" || state?.verified;

  useEffect(() => {
    if (verified) onVerified?.();
  }, [verified, onVerified]);

  if (verified) {
    return (
      <div
        className={
          demoVerified
            ? "rounded-2xl bg-sand-light/50 p-5 ring-1 ring-sand"
            : "rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200"
        }
      >
        <p className={demoVerified ? "font-semibold text-darna-dark" : "font-semibold text-emerald-800"}>
          {demoVerified ? fr.kyc.statutVerifieDemo : fr.kyc.verifieBravo}
        </p>
        {demoVerified ? (
          <p className="mt-1 text-sm text-darna-dark/80">{fr.kyc.verifieDemoBravo}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action}>
      <p className="text-sm text-ink/70">{fr.kyc.cinIntro}</p>

      {state?.error ? (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}

      <label className="mt-3 block max-w-xs space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">{fr.kyc.cin}</span>
        <input
          name="cin"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{8}"
          required
          maxLength={8}
          className={`${fieldBase} w-full font-mono tracking-[0.2em]`}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-xl bg-darna px-6 py-2.5 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
      >
        {pending ? fr.common.chargement : fr.kyc.validerCin}
      </button>
    </form>
  );
}
