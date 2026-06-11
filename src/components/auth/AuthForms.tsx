"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAction,
  registerAction,
  type AuthFormState,
} from "@/actions/auth";
import { useT } from "@/components/i18n/LocaleProvider";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-darna";

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  const fr = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-darna px-5 py-3 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
    >
      {pending ? fr.common.chargement : label}
    </button>
  );
}

function Feedback({ state }: { state: AuthFormState }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
        {state.success}
      </p>
    );
  }
  return null;
}

export function LoginForm() {
  const fr = useT();
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">{fr.auth.email}</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">{fr.auth.motDePasse}</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </label>
      <SubmitButton label={fr.auth.seConnecter} pending={pending} />
      <p className="text-center text-sm text-ink/60">
        {fr.auth.pasDeCompte}{" "}
        <Link href="/inscription" className="font-semibold text-darna underline">
          {fr.auth.sInscrire}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const fr = useT();
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">{fr.auth.nom}</span>
        <input name="name" type="text" required minLength={2} className={inputClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">{fr.auth.email}</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">
          {fr.auth.motDePasse}{" "}
          <span className="font-normal text-ink/40">({fr.auth.motDePasseRegle})</span>
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">
          {fr.auth.telephone}{" "}
          <span className="font-normal text-ink/40">({fr.common.optionnel})</span>
        </span>
        <input name="phone" type="tel" className={inputClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">{fr.auth.role}</span>
        <select name="role" required defaultValue="VOYAGEUR" className={inputClass}>
          <option value="VOYAGEUR">{fr.auth.roleVoyageur}</option>
          <option value="HOTE">{fr.auth.roleHote}</option>
          <option value="AGENCE">{fr.auth.roleAgence}</option>
        </select>
      </label>
      <SubmitButton label={fr.auth.sInscrire} pending={pending} />
      <p className="text-center text-sm text-ink/60">
        {fr.auth.dejaCompte}{" "}
        <Link href="/connexion" className="font-semibold text-darna underline">
          {fr.auth.seConnecter}
        </Link>
      </p>
    </form>
  );
}
