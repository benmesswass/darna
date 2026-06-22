import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { WakilReviewButtons } from "@/components/admin/WakilReviewButtons";

export const metadata = { title: "Gestion des Wakils — Admin Darna" };

export default async function AdminWakilsPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const applications = await prisma.wakilApplication.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      motivation: true,
      status: true,
      createdAt: true,
      userId: true,
      reviewedAt: true,
      reviewedBy: { select: { name: true } },
    },
    take: 100,
  });

  const statusColor: Record<string, string> = {
    RECUE: "bg-blue-100 text-blue-800",
    ENTRETIEN: "bg-yellow-100 text-yellow-800",
    ACCEPTEE: "bg-green-100 text-green-800",
    REFUSEE: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h3 className="mb-4 text-xl font-bold text-darna">{fr.admin.candidaturesWakil}</h3>
      <p className="mb-6 text-sm text-ink/60">{fr.admin.candidaturesWakilDesc}</p>

      {applications.length === 0 ? (
        <p className="text-sm text-ink/50">{fr.admin.aucuneCandidature}</p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-darna-dark">{app.name}</div>
                  <div className="mt-0.5 text-xs text-ink/50">
                    {app.email} · {app.phone} · {app.city}
                  </div>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    statusColor[app.status] ?? "bg-ink/10 text-ink/60"
                  }`}
                >
                  {app.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-ink/70 line-clamp-3">{app.motivation}</p>
              {app.reviewedBy ? (
                <p className="mt-2 text-xs text-ink/40">
                  {fr.admin.revuePar(app.reviewedBy.name)}
                </p>
              ) : null}
              {app.status === "RECUE" || app.status === "ENTRETIEN" ? (
                <div className="mt-4">
                  <WakilReviewButtons
                    applicationId={app.id}
                    labels={{
                      accepter: fr.admin.accepter,
                      refuser: fr.admin.refuser,
                      entretien: fr.admin.planifierEntretien,
                    }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
