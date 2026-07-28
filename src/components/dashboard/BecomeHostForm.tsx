"use client";

import { useActionState, useState } from "react";
import { becomeHostAction, type ProfileFormState } from "@/actions/profile";
import { useT } from "@/components/i18n/LocaleProvider";
import { BuildingIcon, UsersIcon } from "@/components/icons";

function ChoiceCard({
  active,
  onClick,
  icon,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border p-5 text-start transition ${
        active
          ? "border-darna bg-darna/5 ring-2 ring-darna/20"
          : "border-darna/15 hover:bg-cream"
      }`}
    >
      <span className="text-darna-dark">{icon}</span>
      <p className="mt-2 font-bold text-heading">{label}</p>
      <p className="mt-1 text-sm text-muted">{desc}</p>
    </button>
  );
}

export function BecomeHostForm({ callbackUrl }: { callbackUrl?: string }) {
  const fr = useT();
  const [role, setRole] = useState<"HOTE" | "AGENCE">("HOTE");
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    becomeHostAction,
    undefined
  );

  return (
    <form action={action} className="space-y-5">
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      <input type="hidden" name="role" value={role} />
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceCard
          active={role === "HOTE"}
          onClick={() => setRole("HOTE")}
          icon={<BuildingIcon width={22} height={22} />}
          label={fr.auth.roleHote}
          desc={fr.devenirHote.choixHoteDesc}
        />
        <ChoiceCard
          active={role === "AGENCE"}
          onClick={() => setRole("AGENCE")}
          icon={<UsersIcon width={22} height={22} />}
          label={fr.auth.roleAgence}
          desc={fr.devenirHote.choixAgenceDesc}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-darna px-5 py-3 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
      >
        {pending ? fr.common.chargement : fr.devenirHote.cta}
      </button>
    </form>
  );
}
