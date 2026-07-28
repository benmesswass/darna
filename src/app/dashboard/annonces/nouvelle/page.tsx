import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { immoEnabled, stayEnabled, kycGatingEnabled } from "@/lib/modes";
import { resolveCity } from "@/lib/geo";
import { PROPERTY_TYPES, TYPES_BY_VERTICAL, type PropertyType } from "@/lib/constants";
import { PropertyForm } from "@/components/dashboard/PropertyForm";
import { ShieldIcon } from "@/components/icons";

export default async function NouvelleAnnoncePage({
  searchParams,
}: {
  // Préremplissage depuis le simulateur de revenus public (GROWTH_ROADMAP.md §G1).
  searchParams: Promise<{ ville?: string; type?: string }>;
}) {
  const fr = await getT();
  const [user, { ville, type }] = await Promise.all([getSessionUser(), searchParams]);
  const defaultCity = ville ? (resolveCity(ville) ?? undefined) : undefined;
  const defaultType = PROPERTY_TYPES.includes(type as PropertyType)
    ? (type as PropertyType)
    : undefined;
  if (!user) redirect("/connexion");
  if (user.role !== "HOTE" && user.role !== "AGENCE") {
    // Friction d'entrée (§L8.1) : un VOYAGEUR qui atterrit ici veut par
    // définition publier une annonce — on l'envoie devenir hôte plutôt que
    // vers un cul-de-sac, callbackUrl le ramène ici une fois la bascule faite.
    const qs = new URLSearchParams();
    if (ville) qs.set("ville", ville);
    if (type) qs.set("type", type);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    redirect(
      `/dashboard/devenir-hote?callbackUrl=${encodeURIComponent(`/dashboard/annonces/nouvelle${suffix}`)}`
    );
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
        <PropertyForm
          allowedTypes={allowedTypes}
          defaultCity={defaultCity}
          defaultType={defaultType && allowedTypes.includes(defaultType) ? defaultType : undefined}
        />
      </div>
    </div>
  );
}
