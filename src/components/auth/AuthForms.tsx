"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
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

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
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
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
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
      <p className="text-center text-sm">
        <Link
          href="/mot-de-passe-oublie"
          className="font-semibold text-darna underline underline-offset-2"
        >
          {fr.auth.motDePasseOublie}
        </Link>
      </p>
      <p className="text-center text-sm text-ink/60">
        {fr.auth.pasDeCompte}{" "}
        <Link href={inscriptionHref} className="font-semibold text-darna underline">
          {fr.auth.sInscrire}
        </Link>
      </p>
    </form>
  );
}

/** Demande de réinitialisation (saisie e-mail). En démo, affiche le lien renvoyé. */
export function ForgotPasswordForm() {
  const fr = useT();
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      {/* Mode démo : aucun e-mail réel n'est envoyé → on affiche le lien. */}
      {state?.resetUrl ? (
        <div className="rounded-xl bg-sand-light/40 px-4 py-3 text-sm text-darna-dark">
          <p className="font-semibold">{fr.auth.resetModeDemo}</p>
          <Link
            href={state.resetUrl}
            className="mt-1 block break-all font-semibold text-darna underline"
          >
            {fr.auth.resetOuvrirLien}
          </Link>
        </div>
      ) : null}
      <p className="text-sm text-ink/70">{fr.auth.resetSousTitre}</p>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink/70">{fr.auth.email}</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <SubmitButton label={fr.auth.resetEnvoyer} pending={pending} />
      <p className="text-center text-sm text-ink/60">
        <Link href="/connexion" className="font-semibold text-darna underline">
          {fr.auth.resetRetourConnexion}
        </Link>
      </p>
    </form>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/** Choix d'un nouveau mot de passe à partir du jeton (lien reçu / affiché). */
export function ResetPasswordForm({ token }: { token: string }) {
  const fr = useT();
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  const done = Boolean(state?.success);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmError, setConfirmError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (pwd !== confirm) {
      e.preventDefault();
      setConfirmError(fr.profil.mdpConfirmationInvalide);
    } else {
      setConfirmError("");
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-4">
      <Feedback state={state} />
      {done ? (
        <p className="text-center text-sm">
          <Link
            href="/connexion"
            className="font-semibold text-darna underline underline-offset-2"
          >
            {fr.auth.seConnecter}
          </Link>
        </p>
      ) : (
        <>
          <input type="hidden" name="token" value={token} />
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink/70">
              {fr.auth.resetNouveauMdp}{" "}
              <span className="font-normal text-ink/40">({fr.auth.motDePasseRegle})</span>
            </span>
            <div className="relative">
              <input
                name="password"
                type={showPwd ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className={`${inputClass} pe-10`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
                aria-label={showPwd ? "Masquer" : "Afficher"}
              >
                <EyeIcon open={showPwd} />
              </button>
            </div>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink/70">
              {fr.profil.mdpConfirmation}
            </span>
            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setConfirmError(""); }}
                className={`${inputClass} pe-10 ${confirmError ? "border-red-400" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
                aria-label={showConfirm ? "Masquer" : "Afficher"}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {confirmError ? (
              <p className="text-xs text-red-600">{confirmError}</p>
            ) : null}
          </label>
          <SubmitButton label={fr.auth.resetValider} pending={pending} />
        </>
      )}
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
  const [state, action, pending] = useActionState(registerAction, undefined);
  // Après inscription, le compte n'est pas connecté automatiquement : on dirige
  // vers la connexion en conservant la cible (callbackUrl) pour y revenir.
  const connexionHref = callbackUrl
    ? `/connexion?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/connexion";

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
