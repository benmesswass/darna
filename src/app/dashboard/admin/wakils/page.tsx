import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import {
  WakilReviewButtons,
  SoftDeleteWakilButton,
  HardDeleteWakilButton,
} from "@/components/admin/WakilReviewButtons";

export const metadata = { title: "Gestion des Wakils — Admin Darna" };

const appSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  city: true,
  motivation: true,
  status: true,
  createdAt: true,
  interviewAt: true,
  deletedAt: true,
  userId: true,
  reviewedAt: true,
  reviewedBy: { select: { name: true } },
} as const;

const statusColor: Record<string, string> = {
  RECUE: "bg-blue-100 text-blue-800",
  ENTRETIEN: "bg-yellow-100 text-yellow-800",
  ACCEPTEE: "bg-green-100 text-green-800",
  REFUSEE: "bg-red-100 text-red-700",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-TN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminWakilsPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [active, archived] = await Promise.all([
    prisma.wakilApplication.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: appSelect,
      take: 100,
    }),
    prisma.wakilApplication.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: appSelect,
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-10">
      {/* ── Candidatures actives ─────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h3 className="text-xl font-bold text-heading">{fr.admin.candidaturesWakil}</h3>
          {active.length > 0 && (
            <span className="rounded-full bg-darna px-2.5 py-0.5 text-xs font-bold text-white">
              {active.length}
            </span>
          )}
        </div>
        <p className="mb-6 text-sm text-body/60">{fr.admin.candidaturesWakilDesc}</p>

        {active.length === 0 ? (
          <p className="text-sm text-body/50">{fr.admin.aucuneCandidature}</p>
        ) : (
          <div className="space-y-4">
            {active.map((app) => (
              <div
                key={app.id}
                className="rounded-2xl border border-ink/10 bg-surface p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-darna-dark">{app.name}</div>
                    <div className="mt-0.5 text-xs text-body/50">
                      {app.email} · {app.phone} · {app.city}
                    </div>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      statusColor[app.status] ?? "bg-ink/10 text-body/60"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <p className="mt-3 text-sm text-body/70 line-clamp-3">{app.motivation}</p>

                {app.interviewAt ? (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-lg bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-800">
                    📅 {fr.admin.entretienPlanifie(formatDate(app.interviewAt))}
                  </p>
                ) : null}

                {app.reviewedBy ? (
                  <p className="mt-2 text-xs text-body/40">
                    {fr.admin.revuePar(app.reviewedBy.name)}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {app.status === "RECUE" || app.status === "ENTRETIEN" ? (
                    <WakilReviewButtons
                      applicationId={app.id}
                      labels={{
                        accepter: fr.admin.accepter,
                        refuser: fr.admin.refuser,
                        entretien: fr.admin.planifierEntretien,
                        entretienLabel: fr.admin.entretienLabel,
                        entretienPlaceholder: fr.admin.entretienPlaceholder,
                      }}
                    />
                  ) : (
                    <div />
                  )}
                  <SoftDeleteWakilButton
                    applicationId={app.id}
                    label={fr.admin.supprimerCandidature}
                    confirmLabel={fr.admin.archiverCandidatureConfirm}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Candidatures archivées ─────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h3 className="text-xl font-bold text-body/50">{fr.admin.wakilsSupprimees}</h3>
          {archived.length > 0 && (
            <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-bold text-body/50">
              {archived.length}
            </span>
          )}
        </div>
        <p className="mb-4 text-sm text-body/50">{fr.admin.wakilsSupprimeeesDesc}</p>

        {archived.length === 0 ? (
          <p className="text-sm text-body/40">{fr.admin.aucuneCandidatureSupprimee}</p>
        ) : (
          <div className="space-y-3">
            {archived.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-ink/10 bg-sand/30 p-4 opacity-70"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-medium text-body/60">{app.name}</span>
                    <span className="ms-2 text-xs text-body/40">
                      {app.email} · {app.city}
                    </span>
                    <span
                      className={`ms-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        statusColor[app.status] ?? "bg-ink/10 text-body/40"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <HardDeleteWakilButton
                    applicationId={app.id}
                    label={fr.admin.supprimerDefinitivement}
                    confirmLabel={fr.admin.supprimerCandidatureConfirm}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
