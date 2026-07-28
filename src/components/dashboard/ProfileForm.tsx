"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  updateProfileAction,
  type ProfileFormState,
} from "@/actions/profile";
import { useT } from "@/components/i18n/LocaleProvider";
import { CheckIcon, LockIcon, UserIcon } from "@/components/icons";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none transition focus:border-darna focus:ring-2 focus:ring-darna/20";

const labelClass = "text-sm font-semibold text-body/70";

function Feedback({ state }: { state: ProfileFormState }) {
  if (state?.error) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
        {state.error}
      </p>
    );
  }
  if (state?.success) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
        <CheckIcon width={15} height={15} strokeWidth={3} />
        {state.success}
      </p>
    );
  }
  return null;
}

export function ProfileForm({
  name,
  email,
  phone,
  hasPassword,
}: {
  name: string;
  email: string;
  phone: string | null;
  hasPassword: boolean;
}) {
  const fr = useT();
  const [infoState, infoAction, infoPending] = useActionState<
    ProfileFormState,
    FormData
  >(updateProfileAction, undefined);
  const [pwState, pwAction, pwPending] = useActionState<
    ProfileFormState,
    FormData
  >(changePasswordAction, undefined);

  return (
    <div className="space-y-6">
      {/* Informations personnelles */}
      <form action={infoAction} className="rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
        <p className="flex items-center gap-2 font-semibold text-heading">
          <UserIcon width={18} height={18} />
          {fr.profil.infosTitre}
        </p>

        <div className="mt-5 space-y-4">
          <Feedback state={infoState} />

          <label className="block space-y-1.5">
            <span className={labelClass}>{fr.profil.nom}</span>
            <input
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              defaultValue={name}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>{fr.profil.email}</span>
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className={`${inputClass} cursor-not-allowed bg-darna/[0.04] text-body/60`}
            />
            <span className="block text-xs text-body/45">{fr.profil.emailAide}</span>
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>
              {fr.profil.telephone}{" "}
              <span className="font-normal text-body/40">({fr.common.optionnel})</span>
            </span>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={phone ?? ""}
              placeholder={fr.profil.telephonePlaceholder}
              className={inputClass}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={infoPending}
          className="mt-5 rounded-xl bg-darna px-6 py-2.5 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
        >
          {infoPending ? fr.common.chargement : fr.profil.enregistrer}
        </button>
      </form>

      {/* Mot de passe — absent pour un compte Google-only (§L8.2, aucun mot
          de passe Darna à changer). */}
      {hasPassword ? (
        <form action={pwAction} className="rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
          <p className="flex items-center gap-2 font-semibold text-heading">
            <LockIcon width={18} height={18} />
            {fr.profil.mdpTitre}
          </p>
          <p className="mt-1 text-sm text-body/60">{fr.profil.mdpSousTitre}</p>

          <div className="mt-5 space-y-4">
            <Feedback state={pwState} />

            <label className="block space-y-1.5">
              <span className={labelClass}>{fr.profil.mdpActuel}</span>
              <input
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className={labelClass}>{fr.profil.mdpNouveau}</span>
                <input
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={labelClass}>{fr.profil.mdpConfirmation}</span>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={pwPending}
            className="mt-5 rounded-xl border border-darna/20 px-6 py-2.5 text-sm font-bold text-heading transition hover:bg-darna hover:text-white disabled:opacity-60"
          >
            {pwPending ? fr.common.chargement : fr.profil.mdpChanger}
          </button>
        </form>
      ) : null}
    </div>
  );
}
