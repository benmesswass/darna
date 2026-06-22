import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { VerifyPropertyButton, UnverifyPropertyButton } from "@/components/admin/PropertyVerifyButtons";

export const metadata = { title: "Modération des annonces — Admin Darna" };

const propertySelect = {
  id: true,
  title: true,
  city: true,
  verified: true,
  verifiedAt: true,
  createdAt: true,
  owner: {
    select: {
      name: true,
      email: true,
      kycStatus: true,
    },
  },
  verifiedBy: {
    select: { name: true },
  },
} as const;

function KycBadge({ kycStatus }: { kycStatus: string }) {
  const isOk = kycStatus === "VERIFIE" || kycStatus === "DEMO_VERIFIE";
  const isWaiting = kycStatus === "EN_ATTENTE";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
        isOk
          ? "bg-green-100 text-green-800"
          : isWaiting
          ? "bg-yellow-100 text-yellow-800"
          : "bg-red-100 text-red-700"
      }`}
    >
      {kycStatus}
    </span>
  );
}

type Property = {
  id: string;
  title: string;
  city: string;
  verified: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  owner: { name: string; email: string; kycStatus: string };
  verifiedBy: { name: string } | null;
};

function PropertyTable({
  properties,
  fr,
  showVerify,
}: {
  properties: Property[];
  fr: Awaited<ReturnType<typeof getT>>;
  showVerify: boolean;
}) {
  if (properties.length === 0) {
    return <p className="py-4 text-sm text-ink/50">{fr.admin.aucuneAnnonce}</p>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10">
      <table className="w-full text-sm">
        <thead className="bg-sand text-xs font-semibold uppercase tracking-wide text-ink/50">
          <tr>
            <th className="px-4 py-3 text-start">{fr.admin.annonce}</th>
            <th className="px-4 py-3 text-start">{fr.admin.proprietaire}</th>
            <th className="px-4 py-3 text-start">{fr.admin.kycStatut}</th>
            {!showVerify && (
              <th className="px-4 py-3 text-start">{fr.admin.statut}</th>
            )}
            <th className="px-4 py-3 text-end">{fr.admin.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {properties.map((p) => (
            <tr key={p.id} className="transition hover:bg-sand/40">
              <td className="px-4 py-3">
                <div className="line-clamp-1 font-semibold text-darna-dark">{p.title}</div>
                <div className="text-xs text-ink/50">{p.city}</div>
              </td>
              <td className="px-4 py-3">
                <div>{p.owner.name}</div>
                <div className="text-xs text-ink/50">{p.owner.email}</div>
              </td>
              <td className="px-4 py-3">
                <KycBadge kycStatus={p.owner.kycStatus} />
              </td>
              {!showVerify && (
                <td className="px-4 py-3">
                  <div>
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                      {fr.admin.verifiee}
                    </span>
                    {p.verifiedBy ? (
                      <div className="mt-0.5 text-xs text-ink/40">
                        {fr.admin.verifiePar(p.verifiedBy.name)}
                      </div>
                    ) : null}
                  </div>
                </td>
              )}
              <td className="px-4 py-3 text-end">
                {showVerify ? (
                  <VerifyPropertyButton
                    propertyId={p.id}
                    label={fr.admin.verifier}
                    disabled={
                      p.owner.kycStatus !== "VERIFIE" &&
                      p.owner.kycStatus !== "DEMO_VERIFIE"
                    }
                    disabledTitle={fr.admin.proprietaireNonVerifie}
                  />
                ) : (
                  <UnverifyPropertyButton
                    propertyId={p.id}
                    label={fr.admin.retirerVerification}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminAnnoncesPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && !user.isWakil)) redirect("/dashboard");

  const [pending, verified] = await Promise.all([
    // File de modération : annonces actives NON vérifiées
    prisma.property.findMany({
      where: { status: "ACTIVE", verified: false },
      orderBy: { createdAt: "asc" },
      select: propertySelect,
      take: 100,
    }),
    // Annonces déjà vérifiées
    prisma.property.findMany({
      where: { status: "ACTIVE", verified: true },
      orderBy: { createdAt: "desc" },
      select: propertySelect,
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-10">
      {/* ── File de modération ─────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h3 className="text-xl font-bold text-darna">{fr.admin.fileModeration}</h3>
          {pending.length > 0 && (
            <span className="rounded-full bg-darna px-2.5 py-0.5 text-xs font-bold text-white">
              {pending.length}
            </span>
          )}
        </div>
        <p className="mb-6 text-sm text-ink/60">{fr.admin.fileModerationDesc}</p>
        <PropertyTable properties={pending as Property[]} fr={fr} showVerify={true} />
      </section>

      {/* ── Annonces déjà vérifiées ────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h3 className="text-xl font-bold text-ink/70">{fr.admin.annoncesDejVerifiees}</h3>
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
            {verified.length}
          </span>
        </div>
        <PropertyTable properties={verified as Property[]} fr={fr} showVerify={false} />
      </section>
    </div>
  );
}
