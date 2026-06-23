"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function LoginForm({
  callbackUrl,
  registered = false,
  defaultEmail = "",
}: {
  callbackUrl?: string;
  registered?: boolean;
  defaultEmail?: string;
}) {
  const fr = useT();
  const [state, action, pending] = useActionState(loginAction, undefined);
  // On propage le callbackUrl vers l'inscription pour ne pas perdre la cible
  // (ex. « devenir hôte ») si l'utilisateur n'a pas encore de compte.
  const inscriptionHref = callbackUrl
    ? `/inscription?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/inscription";

  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      {/* Bannière affichée quand on arrive juste après une inscription réussie. */}
      {registered && !state ? (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          {fr.auth.compteCreeConnectezVous}
        </p>
      ) : null}
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">{fr.auth.email}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={defaultEmail}
          className={inputClass}
        />
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
        <Link href={inscriptionHref} className="font-semibold text-darna underline">
          {fr.auth.sInscrire}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({
  defaultRole = "VOYAGEUR",
  callbackUrl,
}: {
  defaultRole?: string;
  callbackUrl?: string;
}) {
  const fr = useT();
  const router = useRouter();
  const [state, action, pending] = useActionState(registerAction, undefined);
  // Après inscription, le compte n'est pas connecté automatiquement : on dirige
  // vers la connexion en conservant la cible (callbackUrl) pour y revenir.
  const connexionHref = callbackUrl
    ? `/connexion?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/connexion";

  // Inscription réussie → on ouvre directement la page de connexion, e-mail
  // pré-rempli, pour que l'utilisateur se logue sans ressaisir son adresse.
  useEffect(() => {
    if (!state?.success) return;
    const params = new URLSearchParams({ registered: "1" });
    if (state.email) params.set("email", state.email);
    if (callbackUrl) params.set("callbackUrl", callbackUrl);
    router.replace(`/connexion?${params.toString()}`);
  }, [state, callbackUrl, router]);

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
        <span className="text-sm font-semibold text-ink/70">{fr.auth.confirmerMotDePasse}</span>
        <input
          name="confirmPassword"
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
        <select name="role" required defaultValue={defaultRole} className={inputClass}>
          <option value="VOYAGEUR">{fr.auth.roleVoyageur}</option>
          <option value="HOTE">{fr.auth.roleHote}</option>
          <option value="AGENCE">{fr.auth.roleAgence}</option>
        </select>
      </label>
      <SubmitButton label={fr.auth.sInscrire} pending={pending} />
      <p className="text-center text-sm text-ink/60">
        {fr.auth.dejaCompte}{" "}
        <Link href={connexionHref} className="font-semibold text-darna underline">
          {fr.auth.seConnecter}
        </Link>
      </p>
    </form>
  );
}
