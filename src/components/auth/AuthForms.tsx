"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  loginAction,
  registerAction,
  type AuthFormState,
} from "@/actions/auth";
import { useT } from "@/components/i18n/LocaleProvider";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-darna";

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.12 9.12 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

/**
 * Champ mot de passe avec bouton œil afficher/masquer. Reste non contrôlé
 * (name + reset de formulaire React) : volontairement sans defaultValue pour
 * que les mots de passe se vident à chaque soumission (sécurité + UX demandée).
 */
function PasswordInput({
  name,
  autoComplete,
  minLength,
}: {
  name: string;
  autoComplete: string;
  minLength?: number;
}) {
  const fr = useT();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        name={name}
        type={show ? "text" : "password"}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className={`${inputClass} pe-11`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? fr.auth.masquerMotDePasse : fr.auth.afficherMotDePasse}
        aria-pressed={show}
        tabIndex={-1}
        className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-ink/45 transition hover:text-darna focus:outline-none focus-visible:text-darna"
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

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
  captchaSiteKey = "",
}: {
  callbackUrl?: string;
  registered?: boolean;
  defaultEmail?: string;
  captchaSiteKey?: string;
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
        <PasswordInput name="password" autoComplete="current-password" />
      </label>
      <TurnstileWidget siteKey={captchaSiteKey} />
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
  captchaSiteKey = "",
}: {
  defaultRole?: string;
  callbackUrl?: string;
  captchaSiteKey?: string;
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

  // En cas d'erreur, on repeuple les champs non sensibles renvoyés par l'action
  // (le reset de formulaire React reprend ces defaultValue) ; les mots de passe,
  // eux, n'ont pas de defaultValue → ils se vident, comme demandé.
  const values = state?.values;

  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">{fr.auth.nom}</span>
        <input
          name="name"
          type="text"
          required
          minLength={2}
          defaultValue={values?.name ?? ""}
          className={inputClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">{fr.auth.email}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={values?.email ?? ""}
          className={inputClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">
          {fr.auth.motDePasse}{" "}
          <span className="font-normal text-ink/40">({fr.auth.motDePasseRegle})</span>
        </span>
        <PasswordInput name="password" autoComplete="new-password" minLength={8} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">{fr.auth.confirmerMotDePasse}</span>
        <PasswordInput name="confirmPassword" autoComplete="new-password" minLength={8} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">
          {fr.auth.telephone}{" "}
          <span className="font-normal text-ink/40">({fr.common.optionnel})</span>
        </span>
        <input
          name="phone"
          type="tel"
          defaultValue={values?.phone ?? ""}
          className={inputClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">{fr.auth.role}</span>
        <select
          name="role"
          required
          defaultValue={values?.role || defaultRole}
          className={inputClass}
        >
          <option value="VOYAGEUR">{fr.auth.roleVoyageur}</option>
          <option value="HOTE">{fr.auth.roleHote}</option>
          <option value="AGENCE">{fr.auth.roleAgence}</option>
        </select>
      </label>
      <TurnstileWidget siteKey={captchaSiteKey} />
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
