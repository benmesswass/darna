import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { EmailVerifyFlow } from "@/components/dashboard/EmailVerifyFlow";

export const metadata = { title: "Vérification e-mail — Darna" };

export default async function EmailVerifyPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  return (
    <div className="max-w-lg">
      <h2 className="mb-1 text-2xl font-bold text-darna">{fr.email.titre}</h2>
      <p className="mb-6 text-sm text-ink/60">{fr.email.sousTitre}</p>

      {user.emailVerified ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <p className="font-semibold text-green-800">{fr.email.dejaVerifie}</p>
        </div>
      ) : (
        <EmailVerifyFlow />
      )}
    </div>
  );
}
