import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatDateShortFr } from "@/lib/format";
import {
  validateNonConformityReportAction,
  rejectNonConformityReportAction,
} from "@/actions/admin";
import { ShieldIcon } from "@/components/icons";
import { ConfirmSubmitButton } from "@/components/dashboard/ConfirmSubmitButton";
import type { NonConformityCategory } from "@/lib/constants";

/**
 * Dashboard admin des signalements de non-conformité (LANCEMENT_ROADMAP.md
 * §L5.3) — file d'attente des dossiers RECU (les VALIDE/REJETE sortent de la
 * liste une fois traités, même patron que /dashboard/admin/remboursements et
 * /dashboard/admin/wakils). Valider pose le remboursement des frais et
 * rejoint le circuit §L5.2 (/dashboard/admin/remboursements). Réservé ADMIN.
 */
export default async function AdminNonConformitePage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const reports = await prisma.nonConformityReport.findMany({
    where: { status: "RECU" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      category: true,
      description: true,
      createdAt: true,
      booking: {
        select: {
          amountPaid: true,
          guest: { select: { name: true, email: true } },
          property: { select: { title: true } },
        },
      },
    },
  });

  return (
    <div>
      <h3 className="flex items-center gap-2 text-lg font-bold text-heading">
        <ShieldIcon width={18} height={18} className="text-sand" />
        {fr.admin.nonConformiteTitre}
      </h3>
      <p className="mt-1 text-sm text-body/60">{fr.admin.nonConformiteSousTitre}</p>

      {reports.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-surface p-10 text-center ring-1 ring-darna/10">
          <p className="text-sm text-body/60">{fr.admin.nonConformiteVide}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="rounded-2xl bg-surface p-4 text-start ring-1 ring-darna/10"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-body">{report.booking.guest.name}</span>
                <span className="text-xs text-body/50">{report.booking.guest.email}</span>
                <span className="ms-auto text-xs text-body/45">
                  {report.booking.property.title}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <span className="rounded-full bg-cream px-2.5 py-0.5 font-bold text-heading">
                  {fr.dashboard.signalementCategories[report.category as NonConformityCategory] ??
                    report.category}
                </span>
                <span className="text-body/60">
                  {fr.admin.nonConformiteColSignaleLe} : {formatDateShortFr(report.createdAt)}
                </span>
                <span className="font-semibold text-heading">
                  {fr.admin.nonConformiteColMontantMax} : {report.booking.amountPaid} TND
                </span>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm text-body/80">
                {report.description}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <ConfirmSubmitButton
                  action={validateNonConformityReportAction}
                  confirmMessage={fr.admin.nonConformiteValiderConfirm}
                  hiddenFields={{ reportId: report.id }}
                  label={fr.admin.nonConformiteValider}
                  className="rounded-full bg-darna px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-darna-light"
                />
                <ConfirmSubmitButton
                  action={rejectNonConformityReportAction}
                  confirmMessage={fr.admin.nonConformiteRejeterConfirm}
                  hiddenFields={{ reportId: report.id }}
                  label={fr.admin.nonConformiteRejeter}
                  className="rounded-full border border-darna/20 px-3.5 py-1.5 text-xs font-bold text-heading transition hover:bg-darna hover:text-white"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
