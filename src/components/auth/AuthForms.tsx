"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  type AuthFormState,
} from "@/actions/auth";
import { useT } from "@/components/i18n/LocaleProvider";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { COUNTRY_LABELS } from "@/lib/constants";
import { REFERRAL_SIGNUP_BONUS_TND } from "@/lib/config";
import { CheckIcon } from "@/components/icons";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-darna focus:ring-4 focus:ring-darna/10";

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
 * Petit indicateur animé (cercle qui se remplit + check qui apparaît) pour
 * une règle de saisie respectée en direct — même langage visuel que
 * `SuccessCheck` (D5) mais en version discrète, pensée pour basculer
 * plusieurs fois de suite pendant la frappe (pas une célébration unique).
 */
function LiveRuleHint({ met, label }: { met: boolean; label: string }) {
  return (
    <p
      className={`mt-1.5 flex items-center gap-1.5 text-xs transition-colors duration-300 ${
        met ? "text-emerald-600" : "text-body/40"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
          met ? "border-emerald-600 bg-emerald-600" : "border-ink/25"
        }`}
      >
        <CheckIcon
          width={10}
          height={10}
          strokeWidth={3.5}
          className={`text-white transition-opacity duration-200 ${met ? "opacity-100" : "opacity-0"}`}
        />
      </span>
      {label}
    </p>
  );
}

/**
 * Champ mot de passe avec bouton œil afficher/masquer. Reste non contrôlé
 * (name + reset de formulaire React) : volontairement sans defaultValue pour
 * que les mots de passe se vident à chaque soumission (sécurité + UX demandée).
 * `onValueChange`/`ruleHint` sont de la lecture pure (aucun `value=` posé sur
 * l'input) : ça ne rend pas le champ contrôlé, juste observé en direct pour
 * les micro-interactions (D9).
 */
function PasswordInput({
  name,
  autoComplete,
  minLength,
  hasError,
  ruleHint,
  onValueChange,
}: {
  name: string;
  autoComplete: string;
  minLength?: number;
  hasError?: boolean;
  ruleHint?: string;
  onValueChange?: (value: string) => void;
}) {
  const fr = useT();
  const [show, setShow] = useState(false);
  const [length, setLength] = useState(0);
  return (
    <div>
      <div className="relative">
        <input
          name={name}
          type={show ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          onChange={(e) => {
            setLength(e.target.value.length);
            onValueChange?.(e.target.value);
          }}
          className={`${inputClass} pe-11 ${hasError ? "border-red-400" : ""}`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? fr.auth.masquerMotDePasse : fr.auth.afficherMotDePasse}
          aria-pressed={show}
          tabIndex={-1}
          className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-body/45 transition hover:text-heading focus:outline-none focus-visible:text-heading"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {ruleHint ? <LiveRuleHint met={minLength ? length >= minLength : false} label={ruleHint} /> : null}
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
        <span className="text-sm font-semibold text-body/70">{fr.auth.email}</span>
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
        <span className="text-sm font-semibold text-body/70">{fr.auth.motDePasse}</span>
        <PasswordInput name="password" autoComplete="current-password" />
      </label>
      <TurnstileWidget siteKey={captchaSiteKey} />
      <SubmitButton label={fr.auth.seConnecter} pending={pending} />
      <p className="text-center text-sm">
        <Link
          href="/mot-de-passe-oublie"
          className="font-semibold text-heading underline underline-offset-2"
        >
          {fr.auth.motDePasseOublie}
        </Link>
      </p>
      <p className="text-center text-sm text-body/60">
        {fr.auth.pasDeCompte}{" "}
        <Link href={inscriptionHref} className="font-semibold text-heading underline">
          {fr.auth.sInscrire}
        </Link>
      </p>
    </form>
  );
}

/** Demande de réinitialisation (saisie e-mail). En démo, affiche le lien renvoyé. */
export function ForgotPasswordForm() {
  const fr = useT();
  const [state, action, pending] = useActionState(requestPasswordResetAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      {state?.resetUrl ? (
        <div className="rounded-xl bg-sand-light/40 px-4 py-3 text-sm text-darna-dark">
          <p className="font-semibold">{fr.auth.resetModeDemo}</p>
          <Link
            href={state.resetUrl}
            className="mt-1 block break-all font-semibold text-heading underline"
          >
            {fr.auth.resetOuvrirLien}
          </Link>
        </div>
      ) : null}
      <p className="text-sm text-body/70">{fr.auth.resetSousTitre}</p>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-body/70">{fr.auth.email}</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <SubmitButton label={fr.auth.resetEnvoyer} pending={pending} />
      <p className="text-center text-sm text-body/60">
        <Link href="/connexion" className="font-semibold text-heading underline">
          {fr.auth.resetRetourConnexion}
        </Link>
      </p>
    </form>
  );
}

/**
 * Erreur de confirmation animée (D9) : reste montée en permanence, seule sa
 * hauteur/opacité bascule (`grid-rows` 0fr↔1fr) — un simple montage/démontage
 * conditionnel ne s'anime pas en CSS pur.
 */
function ConfirmMismatchError({ show, message }: { show: boolean; message: string }) {
  return (
    <div
      className={`grid transition-all duration-200 ${
        show ? "mt-1.5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <p className="overflow-hidden text-xs text-red-600">{message}</p>
    </div>
  );
}

/**
 * Les deux mots de passe restent non contrôlés (`PasswordInput`) : ce hook ne
 * fait qu'observer leurs valeurs en direct via `onValueChange` pour calculer
 * la correspondance en live (D9), sans jamais poser de `value=` dessus.
 */
function usePasswordMatch() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  return { setPassword, setConfirmPassword, mismatch };
}

/** Choix d'un nouveau mot de passe à partir du jeton (lien reçu / affiché). */
export function ResetPasswordForm({ token }: { token: string }) {
  const fr = useT();
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  const done = Boolean(state?.success);
  const { setPassword, setConfirmPassword, mismatch } = usePasswordMatch();

  // Garde-fou à la soumission (la validation serveur `.refine()` reste le
  // filet ultime) : la correspondance live ci-dessus couvre déjà l'essentiel.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-4">
      <Feedback state={state} />
      {done ? (
        <p className="text-center text-sm">
          <Link
            href="/connexion"
            className="font-semibold text-heading underline underline-offset-2"
          >
            {fr.auth.seConnecter}
          </Link>
        </p>
      ) : (
        <>
          <input type="hidden" name="token" value={token} />
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-body/70">{fr.auth.resetNouveauMdp}</span>
            <PasswordInput
              name="password"
              autoComplete="new-password"
              minLength={8}
              ruleHint={fr.auth.motDePasseRegle}
              onValueChange={setPassword}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-body/70">
              {fr.auth.confirmerMotDePasse}
            </span>
            <PasswordInput
              name="confirmPassword"
              autoComplete="new-password"
              minLength={8}
              hasError={mismatch}
              onValueChange={setConfirmPassword}
            />
            <ConfirmMismatchError show={mismatch} message={fr.profil.mdpConfirmationInvalide} />
          </label>
          <SubmitButton label={fr.auth.resetValider} pending={pending} />
        </>
      )}
    </form>
  );
}

export function RegisterForm({
  callbackUrl,
  captchaSiteKey = "",
  refCode,
}: {
  callbackUrl?: string;
  captchaSiteKey?: string;
  /** Code de parrainage déjà validé côté serveur (§CR1) — absent si aucun/invalide. */
  refCode?: string;
}) {
  const fr = useT();
  const router = useRouter();
  const [state, action, pending] = useActionState(registerAction, undefined);
  const { setPassword, setConfirmPassword, mismatch } = usePasswordMatch();
  const connexionHref = callbackUrl
    ? `/connexion?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/connexion";

  // Garde-fou à la soumission (la validation serveur `.refine()` reste le
  // filet ultime) : la correspondance live ci-dessus couvre déjà l'essentiel.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) {
      e.preventDefault();
    }
  }

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
    <form action={action} onSubmit={handleSubmit} className="space-y-4">
      <Feedback state={state} />
      {refCode ? (
        <>
          <input type="hidden" name="ref" value={refCode} />
          <p className="rounded-xl bg-sand/40 px-4 py-2.5 text-sm font-medium text-darna-dark">
            {fr.auth.parrainageBanniere(REFERRAL_SIGNUP_BONUS_TND)}
          </p>
        </>
      ) : null}
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-body/70">{fr.auth.nom}</span>
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
        <span className="text-sm font-semibold text-body/70">{fr.auth.email}</span>
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
        <span className="text-sm font-semibold text-body/70">{fr.auth.motDePasse}</span>
        <PasswordInput
          name="password"
          autoComplete="new-password"
          minLength={8}
          ruleHint={fr.auth.motDePasseRegle}
          onValueChange={setPassword}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-body/70">
          {fr.auth.confirmerMotDePasse}
        </span>
        <PasswordInput
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
          hasError={mismatch}
          onValueChange={setConfirmPassword}
        />
        <ConfirmMismatchError show={mismatch} message={fr.profil.mdpConfirmationInvalide} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-body/70">
          {fr.auth.telephone}{" "}
          <span className="font-normal text-body/40">({fr.common.optionnel})</span>
        </span>
        <input
          name="phone"
          type="tel"
          defaultValue={values?.phone ?? ""}
          className={inputClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-body/70">
          {fr.auth.pays}{" "}
          <span className="font-normal text-body/40">({fr.common.optionnel})</span>
        </span>
        <select name="country" defaultValue="" className={inputClass}>
          <option value="">—</option>
          {COUNTRY_LABELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <TurnstileWidget siteKey={captchaSiteKey} />
      <SubmitButton label={fr.auth.sInscrire} pending={pending} />
      <p className="text-center text-sm text-body/60">
        {fr.auth.dejaCompte}{" "}
        <Link href={connexionHref} className="font-semibold text-heading underline">
          {fr.auth.seConnecter}
        </Link>
      </p>
    </form>
  );
}
