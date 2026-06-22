"use client";

import { useActionState, useTransition } from "react";
import { verifyPropertyAction, unverifyPropertyAction } from "@/actions/admin";

// ── Bouton de vérification ──────────────────────────────────────────────────

type VerifyProps = {
  propertyId: string;
  label: string;
  disabled?: boolean;
  disabledTitle?: string;
};

export function VerifyPropertyButton({ propertyId, label, disabled, disabledTitle }: VerifyProps) {
  const [state, action] = useActionState(verifyPropertyAction, undefined);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => startTransition(() => action(fd))}
      className="inline"
    >
      <input type="hidden" name="propertyId" value={propertyId} />
      {state?.error ? (
        <span className="me-2 text-xs text-red-600">{state.error}</span>
      ) : null}
      <button
        type="submit"
        disabled={disabled || isPending}
        title={disabled ? disabledTitle : undefined}
        className="rounded-lg bg-darna px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-darna/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "…" : label}
      </button>
    </form>
  );
}

// ── Bouton de retrait de vérification ─────────────────────────────────────────

type UnverifyProps = {
  propertyId: string;
  label: string;
};

export function UnverifyPropertyButton({ propertyId, label }: UnverifyProps) {
  const [state, action] = useActionState(unverifyPropertyAction, undefined);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => startTransition(() => action(fd))}
      className="inline"
    >
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
