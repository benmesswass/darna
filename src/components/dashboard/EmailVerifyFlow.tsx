"use client";

import { useActionState, useTransition, startTransition } from "react";
import { requestEmailOtpAction, verifyEmailOtpAction } from "@/actions/email";
import { useT } from "@/components/i18n/LocaleProvider";

export function EmailVerifyFlow() {
  const fr = useT();
  const [requestState, requestAction] = useActionState(requestEmailOtpAction, undefined);
  const [verifyState, verifyAction] = useActionState(verifyEmailOtpAction, undefined);
  const [isPending, startT] = useTransition();

  const isVerified = requestState?.verified || verifyState?.verified;
  const hasSent = requestState?.sent;
  const demoCode = requestState?.otp;

  if (isVerified) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <p className="font-semibold text-green-800">{fr.email.verifieBravo}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hasSent ? (
        <div>
          <p className="mb-4 text-sm text-ink/70">{fr.email.description}</p>
          <form
            action={() => {
              startT(() => startTransition(() => requestAction()));
            }}
          >
            {requestState?.error ? (
              <p className="mb-3 text-sm text-red-600">{requestState.error}</p>
            ) : null}
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-darna px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-darna/90 disabled:opacity-50"
            >
              {isPending ? "…" : fr.email.envoyerCode}
            </button>
          </form>
        </div>
      ) : (
        <div>
          {demoCode ? (
            <div className="mb-4 rounded-xl border border-dashed border-darna/30 bg-sand/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-darna/60">
                {fr.email.modeDemoCode}
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-darna">
                {demoCode}
              </p>
            </div>
          ) : (
            <p className="mb-4 text-sm text-ink/70">{fr.email.codeEnvoye}</p>
          )}

          <form
            action={(fd) => startT(() => startTransition(() => verifyAction(fd)))}
            className="flex max-w-xs gap-3"
          >
            {verifyState?.error ? (
              <p className="mb-2 w-full text-sm text-red-600">{verifyState.error}</p>
            ) : null}
            <input
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              required
              className="w-full rounded-xl border border-ink/20 px-4 py-2.5 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-darna/30"
            />
            <button
              type="submit"
              disabled={isPending}
              className="shrink-0 rounded-xl bg-darna px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-darna/90 disabled:opacity-50"
            >
              {isPending ? "…" : fr.email.valider}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
