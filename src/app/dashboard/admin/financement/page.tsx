import { redirect } from "next/navigation";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatDateShortFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { FolderIcon } from "@/components/icons";

/**
 * Dashboard admin des leads financement (MONETISATION_IMMO_ROADMAP.md §MI5) —
 * vue en lecture seule + export CSV pour un futur partenaire bancaire. Aucune
 * action de traitement ici : la monétisation réelle (commission facturée à
 * la banque) est bloquée tant qu'aucun partenariat n'est signé, ce dashboard
 * ne fait que rendre les leads déjà capturés exploitables manuellement.
 */
export default async function AdminFinancementPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const leads = await prisma.financingLead.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      desiredAmount: true,
      message: true,
      createdAt: true,
      property: { select: { title: true, slug: true } },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-heading">{fr.admin.financementTitre}</h3>
          <p className="mt-1 max-w-2xl text-sm text-body/60">{fr.admin.financementSousTitre}</p>
        </div>
        {leads.length > 0 ? (
          <Link
            href="/api/admin/financing-leads/export"
            className="inline-flex items-center gap-1.5 rounded-full border border-darna/20 px-4 py-2 text-xs font-bold text-heading transition hover:bg-darna hover:text-white"
          >
            <FolderIcon width={14} height={14} />
            {fr.admin.financementExporter}
          </Link>
        ) : null}
      </div>

      {leads.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-surface p-10 text-center ring-1 ring-darna/10">
          <p className="text-sm text-body/60">{fr.admin.financementVide}</p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl ring-1 ring-darna/10">
          <table className="w-full text-sm">
            <thead className="bg-sand text-xs font-semibold uppercase tracking-wide text-darna-dark/70">
              <tr>
                <th className="px-4 py-3 text-start">{fr.admin.financementColDate}</th>
                <th className="px-4 py-3 text-start">{fr.admin.financementColAnnonce}</th>
                <th className="px-4 py-3 text-start">{fr.admin.financementColContact}</th>
                <th className="px-4 py-3 text-end">{fr.admin.financementColMontant}</th>
                <th className="px-4 py-3 text-start">{fr.admin.financementColMessage}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 bg-surface">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-4 py-2.5 text-xs text-body/60">
                    {formatDateShortFr(lead.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/annonce/${lead.property.slug}`}
                      className="font-medium text-darna hover:underline"
                    >
                      {lead.property.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-body">{lead.name}</p>
                    <p className="text-xs text-body/50">
                      {lead.email} · {lead.phone}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-end font-semibold text-heading">
                    {lead.desiredAmount ? <Price amount={lead.desiredAmount} /> : "—"}
                  </td>
                  <td className="max-w-xs px-4 py-2.5 text-xs text-body/60">
                    {lead.message ?? "—"}
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
