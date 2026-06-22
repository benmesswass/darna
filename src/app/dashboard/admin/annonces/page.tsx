import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { VerifyPropertyButton, UnverifyPropertyButton } from "@/components/admin/PropertyVerifyButtons";

export const metadata = { title: "Modération des annonces — Admin Darna" };

export default async function AdminAnnoncesPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  // File de modération : annonces actives non encore vérifiées + annonces vérifiées
  const properties = await prisma.property.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ verified: "asc" }, { createdAt: "desc" }],
    select: {
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
    },
    take: 100,
  });

  return (
    <div>
      <h3 className="mb-4 text-xl font-bold text-darna">{fr.admin.fileModeration}</h3>
      <p className="mb-6 text-sm text-ink/60">{fr.admin.fileModerationDesc}</p>

      {properties.length === 0 ? (
        <p className="text-sm text-ink/50">{fr.admin.aucuneAnnonce}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/10">
          <table className="w-full text-sm">
            <thead className="bg-sand text-xs font-semibold uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3 text-start">{fr.admin.annonce}</th>
                <th className="px-4 py-3 text-start">{fr.admin.proprietaire}</th>
                <th className="px-4 py-3 text-start">{fr.admin.kycStatut}</th>
                <th className="px-4 py-3 text-start">{fr.admin.statut}</th>
                <th className="px-4 py-3 text-end">{fr.admin.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-sand/40 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-darna-dark line-clamp-1">{p.title}</div>
                    <div className="text-xs text-ink/50">{p.city}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{p.owner.name}</div>
                    <div className="text-xs text-ink/50">{p.owner.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.owner.kycStatus === "VERIFIE" || p.owner.kycStatus === "DEMO_VERIFIE"
                          ? "bg-green-100 text-green-800"
                          : p.owner.kycStatus === "EN_ATTENTE"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.owner.kycStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.verified ? (
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
                    ) : (
                      <span className="inline-flex rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink/60">
                        {fr.admin.nonVerifiee}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    {p.verified ? (
                      <UnverifyPropertyButton propertyId={p.id} label={fr.admin.retirerVerification} />
                    ) : (
                      <VerifyPropertyButton
                        propertyId={p.id}
                        label={fr.admin.verifier}
                        disabled={
                          p.owner.kycStatus !== "VERIFIE" &&
                          p.owner.kycStatus !== "DEMO_VERIFIE"
                        }
                        disabledTitle={fr.admin.proprietaireNonVerifie}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
