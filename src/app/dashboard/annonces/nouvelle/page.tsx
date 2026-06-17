import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { immoEnabled, stayEnabled } from "@/lib/modes";
import { TYPES_BY_VERTICAL, type PropertyType } from "@/lib/constants";
import { PropertyForm } from "@/components/dashboard/PropertyForm";

export default async function NouvelleAnnoncePage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (user.role !== "HOTE" && user.role !== "AGENCE") {
    redirect("/dashboard/reservations");
  }

  // Types proposés à la création = ceux des verticales activées (cf. modes.ts).
  const allowedTypes: PropertyType[] = [
    ...(stayEnabled() ? TYPES_BY_VERTICAL.STAY : []),
    ...(immoEnabled() ? TYPES_BY_VERTICAL.IMMO : []),
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-darna">{fr.dashboard.nouvelleAnnonce}</h2>
      <div className="mt-5 rounded-3xl bg-white p-6 ring-1 ring-darna/10">
        <PropertyForm allowedTypes={allowedTypes} />
      </div>
    </div>
  );
}
