import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: frMeta.auth.connexionTitre };

export default async function ConnexionPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-center text-3xl font-bold text-darna">
        {fr.auth.connexionTitre}
      </h1>
      <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-darna/10">
        <LoginForm />
      </div>
    </div>
  );
}
