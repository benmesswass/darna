"use client";

import { useActionState } from "react";
import { payHostVerificationDemoAction } from "@/actions/host-verification-payments";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Version DÉMO (Konnect désactivé) du paiement de vérification Wakil HOTE.
 * Miroir de HostVerificationPayButton mais sans redirection externe — l'état
 * pending est le seul retour visible pendant l'aller-retour serveur (la carte
 * bascule ensuite sur le message « crédit prêt » une fois la page revalidée,
 * cf. src/app/dashboard/annonces/page.tsx).
 */
export function HostVerificationDemoPayButton({ label }: { label: string }) {
  const fr = useT();
  const [, action, pending] = useActionState<undefined, FormData>(
    payHostVerificationDemoAction,
    undefined
  );

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-darna-dark transition hover:bg-amber-300 disabled:opacity-60"
      >
        {pending ? fr.common.chargement : label}
      </button>
    </form>
  );
}
