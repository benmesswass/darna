import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatDateShortFr, formatMonthYearFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { CoinsIcon } from "@/components/icons";

export const metadata: Metadata = { title: frMeta.factures.listeTitre };

/**
 * Liste des HostInvoice de l'hôte connecté (PAIEMENT_SUR_PLACE_ROADMAP.md
 * §PSP5) — distinct du dashboard admin (§PSP8, toutes les factures/tous les
 * hôtes) et de la page de paiement unique (§PSP4, `/dashboard/factures/[id]`,
 * qui reste le seul endroit où le paiement réel/démo s'exécute — cette liste
 * ne fait que renvoyer vers elle, pas de duplication des deux mécaniques de
 * paiement sur cette page). « EN_RETARD » est un badge d'AFFICHAGE dérivé
 * (status === "EN_ATTENTE" && dueAt < now) — n'existe pas en base (cf. PSP1).
 */
export default async function FacturesListPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const invoices = await prisma.hostInvoice.findMany({
    where: { hostId: user.id },
    // Tri par mois de création (le plus récent d'abord) — dominant, pour que
    // le regroupement par mois ci-dessous produise des mois strictement
    // chronologiques (jamais entrelacés par statut).
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      status: true,
      dueAt: true,
      paidAt: true,
      createdAt: true,
      booking: { select: { property: { select: { title: true } } } },
    },
  });

  const now = new Date();

  // Regroupement par mois de création (pure présentation — le modèle de
  // facturation reste par réservation, cf. LANCEMENT_ROADMAP.md §L5.7
  // « Décision de facturation »). `Map` préserve l'ordre d'insertion, donc
  // l'ordre des mois suit l'ordre de tri des factures ci-dessus.
  const invoicesByMonth = new Map<string, typeof invoices>();
  for (const invoice of invoices) {
    const key = formatMonthYearFr(invoice.createdAt);
    const bucket = invoicesByMonth.get(key);
    if (bucket) bucket.push(invoice);
    else invoicesByMonth.set(key, [invoice]);
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-heading">{fr.factures.listeTitre}</h3>
      <p className="mt-1 text-sm text-muted">{fr.factures.listeSousTitre}</p>

      <div className="mt-4 rounded-2xl bg-cream/50 p-3.5 ring-1 ring-darna/15">
        <p className="text-xs font-bold text-heading">{fr.factures.explicationTitre}</p>
        <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-muted">
          {fr.factures.explicationPoints.map((point) => (
            <li key={point}>· {point}</li>
          ))}
        </ul>
      </div>

      {invoices.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-surface p-10 text-center ring-1 ring-darna/10">
          <CoinsIcon width={28} height={28} className="mx-auto text-subtle" />
          <p className="mt-3 text-sm text-muted">{fr.factures.vide}</p>
        </div>
      ) : (
        Array.from(invoicesByMonth.entries()).map(([month, monthInvoices]) => {
          const monthTotal = monthInvoices.reduce((sum, i) => sum + i.amount, 0);
          return (
            <div key={month} className="mt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-heading">{month}</h4>
                <p className="text-xs font-semibold text-muted">
                  {fr.factures.totalMois} · <Price amount={monthTotal} />
                </p>
              </div>
              <ul className="mt-3 space-y-3">
                {monthInvoices.map((invoice) => {
                  const overdue = invoice.status === "EN_ATTENTE" && invoice.dueAt < now;
                  return (
                    <li
                      key={invoice.id}
                      id={invoice.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4 ring-1 ring-darna/10"
                    >
                      <div>
                        <p className="font-semibold text-body">
                          {invoice.booking.property.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              invoice.status === "PAYEE"
                                ? "bg-emerald-100 text-emerald-700"
                                : overdue
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {invoice.status === "PAYEE"
                              ? fr.factures.statutPayee
                              : overdue
                                ? fr.factures.statutEnRetard
                                : fr.factures.statutEnAttente}
                          </span>
                          {invoice.status === "PAYEE" && invoice.paidAt
                            ? fr.factures.payeLe(formatDateShortFr(invoice.paidAt))
                            : fr.factures.echeance(formatDateShortFr(invoice.dueAt))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-heading">
                          <Price amount={invoice.amount} />
                        </span>
                        {invoice.status === "EN_ATTENTE" ? (
                          <Link
                            href={`/dashboard/factures/${invoice.id}`}
                            className="rounded-full bg-sand px-4 py-2 text-xs font-bold text-darna-dark transition hover:bg-sand-light"
                          >
                            {fr.factures.payerKonnect}
                          </Link>
                        ) : (
                          <Link
                            href={`/dashboard/factures/${invoice.id}`}
                            className="rounded-full border border-darna/20 px-4 py-2 text-xs font-bold text-heading transition hover:bg-darna hover:text-white"
                          >
                            {fr.factures.voirFacture}
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
}
