"use client";

import { useActionState } from "react";
import {
  requestKycOtpAction,
  verifyKycOtpAction,
  type KycFormState,
} from "@/actions/kyc";
import { fr } from "@/lib/i18n/fr";
import { CheckIcon, ShieldIcon } from "@/components/icons";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-darna";

export function KycFlow({ initialStatus }: { initialStatus: string }) {
  const [requestState, requestAction, requestPending] = useActionState<
    KycFormState,
    FormData
  >(requestKycOtpAction, undefined);
  const [verifyState, verifyAction, verifyPending] = useActionState<
    KycFormState,
    FormData
  >(verifyKycOtpAction, undefined);

  const verified = initialStatus === "VERIFIE" || verifyState?.verified;

  if (verified) {
    return (
      <div className="rounded-3xl bg-emerald-50 p-8 text-center ring-1 ring-emerald-200">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
          <CheckIcon width={28} height={28} strokeWidth={2.5} />
        </span>
        <p className="mt-4 text-lg font-bold text-emerald-800">
          {fr.kyc.statutVerifie}
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-emerald-700">
          {initialStatus === "VERIFIE" ? fr.kyc.dejaVerifie : fr.kyc.verifieBravo}
        </p>
      </div>
    );
  }

  const otp = requestState?.otp;

  return (
    <div className="space-y-5">
      {/* Étape 1 : CIN + téléphone */}
      <form
        action={requestAction}
        className="rounded-3xl bg-white p-6 ring-1 ring-darna/10"
      >
        <p className="flex items-center gap-2 font-semibold text-darna">
          <ShieldIcon width={18} height={18} />
          {fr.kyc.titre}
        </p>
        <p className="mt-1 text-sm text-ink/60">{fr.kyc.sousTitre}</p>

        {requestState?.error ? (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
            {requestState.error}
          </p>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink/70">{fr.kyc.cin}</span>
            <input
              name="cin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{8}"
              required
              maxLength={8}
              className={inputClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink/70">{fr.kyc.telephone}</span>
            <input name="phone" type="tel" required className={inputClass} />
          </label>
        </div>
        <button
          type="submit"
          disabled={requestPending}
          className="mt-4 rounded-xl bg-darna px-6 py-2.5 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
        >
          {requestPending ? fr.common.chargement : fr.kyc.envoyerOtp}
        </button>
      </form>

      {/* Étape 2 : OTP mock affiché à l'écran */}
      {otp ? (
        <form
          action={verifyAction}
          className="rounded-3xl bg-white p-6 ring-1 ring-sand"
        >
          <p className="rounded-xl bg-sand-light/60 px-4 py-3 text-sm font-medium text-darna-dark">
            {fr.kyc.otpMockInfo}
          </p>
          <div className="mt-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              {fr.kyc.votreCode}
            </p>
            <p className="mt-1 font-mono text-4xl font-bold tracking-[0.4em] text-darna">
              {otp}
            </p>
          </div>

          {verifyState?.error ? (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {verifyState.error}
            </p>
          ) : null}

          <label className="mt-4 block space-y-1.5">
            <span className="text-sm font-semibold text-ink/70">{fr.kyc.saisirOtp}</span>
            <input
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
              maxLength={6}
              className={`${inputClass} text-center font-mono text-lg tracking-[0.3em]`}
            />
          </label>
          <button
            type="submit"
            disabled={verifyPending}
            className="mt-4 w-full rounded-xl bg-sand px-6 py-2.5 text-sm font-bold text-darna-dark transition hover:bg-sand-light disabled:opacity-60"
          >
            {verifyPending ? fr.common.chargement : fr.kyc.valider}
          </button>
        </form>
      ) : null}
    </div>
  );
}
