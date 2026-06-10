import { redirect } from "next/navigation";
import { fr } from "@/lib/i18n/fr";
import { getSessionUser } from "@/lib/session";
import { PropertyForm } from "@/components/dashboard/PropertyForm";

export default async function NouvelleAnnoncePage() {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (user.role !== "HOTE" && user.role !== "AGENCE") {
    redirect("/dashboard/reservations");
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-darna">{fr.dashboard.nouvelleAnnonce}</h2>
      <div className="mt-5 rounded-3xl bg-white p-6 ring-1 ring-darna/10">
        <PropertyForm />
      </div>
    </div>
  );
}
