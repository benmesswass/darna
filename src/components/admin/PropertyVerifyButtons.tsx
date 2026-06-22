"use client";

import { useActionState, useTransition } from "react";
import { verifyPropertyAction, unverifyPropertyAction } from "@/actions/admin";

type VerifyProps = {
  propertyId: string;
  labelRemote: string;
  labelOnSite: string;
  disabled?: boolean;
  disabledTitle?: string;
};

export function VerifyPropertyButton({
  propertyId,
  labelRemote,
  labelOnSite,
  disabled,
  disabledTitle,
}: VerifyProps) {
  const [state, action] = useActionState(verifyPropertyAction, undefined);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1.5">
      {state?.error ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}

      {/* Vérifié Darna — REMOTE */}
      <form action={(fd) => startTransition(() => action(fd))} className="inline">
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="verificationLevel" value="REMOTE" />
        <button
          type="submit"
          disabled={disabled || isPending}
          title={disabled ? disabledTitle : undefined}
          className="inline-flex items-center gap-1.5 rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          🛡️ {isPending ? "…" : labelRemote}
        </button>
      </form>

      {/* Certifié Wakil — ON_SITE */}
      <form action={(fd) => startTransition(() => action(fd))} className="inline">
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="verificationLevel" value="ON_SITE" />
        <button
          type="submit"
          disabled={disabled || isPending}
          title={disabled ? disabledTitle : undefined}
          className="inline-flex items-center gap-1.5 rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          🏅 {isPending ? "…" : labelOnSite}
        </button>
      </form>
    </div>
  );
}

type UnverifyProps = {
  propertyId: string;
  label: string;
};

export function UnverifyPropertyButton({ propertyId, label }: UnverifyProps) {
  const [state, action] = useActionState(unverifyPropertyAction, undefined);
  const [isPending, startTransition] = useTransition();

  return (
    <form action={(fd) => startTransition(() => action(fd))} className="inline">
      <input type="hidden" name="propertyId" value={propertyId} />
      {state?.error ? (
        <span className="me-2 text-xs text-red-600">{state.error}</span>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
      >
        {isPending ? "…" : label}
      </button>
    </form>
  );
}
