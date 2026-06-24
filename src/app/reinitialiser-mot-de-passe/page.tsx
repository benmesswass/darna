import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { fr as frMeta } from "@/lib/i18n/fr";
import { ResetPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: frMeta.auth.resetTitre };

export default async function ReinitialiserMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const fr = await getT();
  const { token } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-center text-3xl font-bold text-darna">
        {fr.auth.resetTitre}
      </h1>
      <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-darna/10">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          // Jeton absent de l'URL : on renvoie vers une nouvelle demande.
          <div className="space-y-4 text-center">
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
            >
              {fr.auth.resetLienInvalide}
            </p>
            <Link
              href="/mot-de-passe-oublie"
              className="inline-block font-semibold text-darna underline underline-offset-2"
            >
              {fr.auth.resetTitre}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
