import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { immoEnabled, stayEnabled, kycGatingEnabled } from "@/lib/modes";
import { TYPES_BY_VERTICAL, type PropertyType } from "@/lib/constants";
import { PropertyForm } from "@/components/dashboard/PropertyForm";
import { ShieldIcon } from "@/components/icons";

export default async function NouvelleAnnoncePage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (user.role !== "HOTE" && user.role !== "AGENCE") {
    redirect("/dashboard/reservations");
  }

  // Gating KYC : on prévient l'hôte AVANT qu'il ne remplisse le formulaire
  // (l'action de création reste la garde réelle — cf. createPropertyAction).
  const isVerified =
    user.kycStatus === "VERIFIE" || user.kycStatus === "DEMO_VERIFIE";
  if (kycGatingEnabled() && !isVerified) {
    return (
      <div>
        <h2 className="text-xl font-bold text-heading">{fr.dashboard.nouvelleAnnonce}</h2>
        <div className="mt-5 max-w-2xl rounded-3xl bg-surface p-8 text-center ring-1 ring-darna/10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sand">
            <ShieldIcon width={26} height={26} className="text-darna-dark" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-heading">
            {fr.kyc.gateRequiseTitre}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-body/70">
            {fr.kyc.gateRequiseDesc}
          </p>
          <Link
            href="/dashboard/kyc"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-darna px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-darna-light"
          >
            {fr.kyc.gateRequiseCta}
          </Link>
        </div>
      </div>
    );
  }

  // Types proposés à la création = ceux des verticales activées (cf. modes.ts).
  const allowedTypes: PropertyType[] = [
    ...(stayEnabled() ? TYPES_BY_VERTICAL.STAY : []),
    ...(immoEnabled() ? TYPES_BY_VERTICAL.IMMO : []),
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-heading">{fr.dashboard.nouvelleAnnonce}</h2>
      <div className="mt-5 rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
        <PropertyForm allowedTypes={allowedTypes} />
      </div>
    </div>
  );
}
