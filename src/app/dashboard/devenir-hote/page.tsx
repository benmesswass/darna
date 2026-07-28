import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { safeCallbackUrl } from "@/lib/redirect";
import { BecomeHostForm } from "@/components/dashboard/BecomeHostForm";

export default async function DevenirHotePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const fr = await getT();
  const { callbackUrl } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  // Déjà HOTE/AGENCE/ADMIN : rien à faire ici, direction la cible d'origine
  // (ou la liste d'annonces par défaut).
  if (user.role !== "VOYAGEUR") {
    redirect(safeCallbackUrl(callbackUrl, "/dashboard/annonces"));
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-heading">{fr.devenirHote.titre}</h2>
      <p className="mt-1 text-sm text-body/60">{fr.devenirHote.sousTitre}</p>
      <div className="mt-6 rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
        <BecomeHostForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
