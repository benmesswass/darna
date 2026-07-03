"use client";

import { useActionState, useEffect } from "react";
import {
  requestPhoneOtpAction,
  verifyPhoneOtpAction,
  type KycFormState,
} from "@/actions/kyc";
import { useT } from "@/components/i18n/LocaleProvider";
import { PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY } from "@/lib/constants";

const fieldBase =
  "rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-darna";

/** Étape « Téléphone » : envoi puis vérification d'un OTP (SMS / WhatsApp). */
export function PhoneVerifyFlow({
  initialVerified,
  onVerified,
}: {
  initialVerified: boolean;
  onVerified?: () => void;
}) {
  const fr = useT();
  const [requestState, requestAction, requestPending] = useActionState<KycFormState, FormData>(
    requestPhoneOtpAction,
    undefined
  );
  const [verifyState, verifyAction, verifyPending] = useActionState<KycFormState, FormData>(
    verifyPhoneOtpAction,
    undefined
  );

  const verified = initialVerified || verifyState?.verified;

  // Auto-avance : prévient l'assistant dès que l'étape est franchie.
  useEffect(() => {
    if (verified) onVerified?.();
  }, [verified, onVerified]);

  if (verified) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="font-semibold text-emerald-800">{fr.kyc.telephoneVerifie}</p>
      </div>
    );
  }

  const otp = requestState?.otp;
  const sent = requestState?.sent;

  return (
    <div className="space-y-5">
      <form action={requestAction}>
        <p className="text-sm text-body/70">{fr.kyc.telephoneIntro}</p>

        {requestState?.error ? (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
            {requestState.error}
          </p>
        ) : null}

        <label className="mt-3 block space-y-1.5">
          <span className="text-sm font-semibold text-body/70">{fr.kyc.telephone}</span>
          <div className="flex gap-2">
            <select
              name="phoneCountry"
              defaultValue={DEFAULT_PHONE_COUNTRY}
              aria-label={fr.kyc.indicatifPays}
              className={`${fieldBase} shrink-0`}
            >
              {PHONE_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} +{c.code}
                </option>
              ))}
            </select>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              required
              placeholder={fr.kyc.telephonePlaceholder}
              className={`${fieldBase} min-w-0 flex-1`}
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={requestPending}
          className="mt-4 rounded-xl bg-darna px-6 py-2.5 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
        >
          {requestPending ? fr.common.chargement : fr.kyc.envoyerOtp}
        </button>
      </form>

      {sent ? (
        <form action={verifyAction} className="rounded-2xl bg-sand/10 p-4 ring-1 ring-sand/40">
          {otp ? (
            <>
              <p className="rounded-xl bg-sand-light/60 px-4 py-3 text-sm font-medium text-darna-dark">
                {fr.kyc.otpMockInfo}
              </p>
              <div className="mt-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-body/50">
                  {fr.kyc.votreCode}
                </p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-[0.4em] text-heading">{otp}</p>
              </div>
            </>
          ) : (
            <p className="rounded-xl bg-sand-light/60 px-4 py-3 text-sm font-medium text-darna-dark">
              {fr.kyc.otpSmsInfo}
            </p>
          )}

          {verifyState?.error ? (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {verifyState.error}
            </p>
          ) : null}

          <label className="mt-3 block space-y-1.5">
            <span className="text-sm font-semibold text-body/70">{fr.kyc.saisirOtp}</span>
            <input
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
              maxLength={6}
              className={`${fieldBase} w-full text-center font-mono text-lg tracking-[0.3em]`}
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
