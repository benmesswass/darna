import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatDateShortFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { isSuspended } from "@/lib/suspension";
import {
  reactivateUserAction,
  sendHostInvoiceReminderAction,
  suspendHostForInvoiceAction,
} from "@/actions/admin";
import { AlertTriangleIcon, CoinsIcon } from "@/components/icons";
import { ConfirmSubmitButton } from "@/components/dashboard/ConfirmSubmitButton";

/**
 * Dashboard admin des factures hôtes (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP8) :
 * vue d'ensemble comptable (total dû/encaissé, en retard) + relance et
 * suspension MANUELLES — distinct du dashboard hôte (une facture à la fois,
 * §PSP4) et des rappels/masquage AUTOMATIQUES (§PSP5/§PSP6, pas encore livrés).
 * Réservé ADMIN (le layout admin laisse aussi passer les wakils, hors scope
 * pour une vue financière).
 */
export default async function AdminFacturesPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const invoices = await prisma.hostInvoice.findMany({
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    select: {
      id: true,
      amount: true,
      status: true,
      dueAt: true,
      paidAt: true,
      lastReminderAt: true,
      host: { select: { id: true, name: true, email: true, suspended: true, suspendedUntil: true } },
      booking: { select: { property: { select: { title: true } } } },
    },
  });

  const now = new Date();
  const totalDu = invoices
    .filter((i) => i.status === "EN_ATTENTE")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalEncaisse = invoices
    .filter((i) => i.status === "PAYEE")
    .reduce((sum, i) => sum + i.amount, 0);
  const enRetard = invoices.filter((i) => i.status === "EN_ATTENTE" && i.dueAt < now);

  return (
    <div>
      <h3 className="text-lg font-bold text-heading">{fr.admin.facturesTitre}</h3>
      <p className="mt-1 text-sm text-muted">{fr.admin.facturesSousTitre}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface p-4 ring-1 ring-darna/10">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <CoinsIcon width={14} height={14} />
            {fr.admin.facturesTotalDu}
          </p>
          <p className="mt-1 text-2xl font-bold text-heading">
            <Price amount={totalDu} />
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-4 ring-1 ring-darna/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {fr.admin.facturesTotalEncaisse}
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            <Price amount={totalEncaisse} />
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-4 ring-1 ring-darna/10">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <AlertTriangleIcon width={14} height={14} className={enRetard.length ? "text-red-600" : ""} />
            {fr.admin.facturesStatutEnRetard}
          </p>
          <p
            aria-label={fr.admin.facturesEnRetard(enRetard.length)}
            className={`mt-1 text-2xl font-bold ${enRetard.length ? "text-red-600" : "text-heading"}`}
          >
            {enRetard.length}
          </p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-surface p-10 text-center ring-1 ring-darna/10">
          <p className="text-sm text-muted">{fr.admin.facturesVide}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {invoices.map((invoice) => {
            const overdue = invoice.status === "EN_ATTENTE" && invoice.dueAt < now;
            const hostSuspended = isSuspended(invoice.host);
            return (
              <li
                key={invoice.id}
                className="rounded-2xl bg-surface p-4 text-start ring-1 ring-darna/10"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-body">{invoice.host.name}</span>
                  <span className="text-xs text-muted">{invoice.host.email}</span>
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
                      ? fr.admin.facturesStatutPayee
                      : overdue
                        ? fr.admin.facturesStatutEnRetard
                        : fr.admin.facturesStatutEnAttente}
                  </span>
                  {hostSuspended ? (
                    <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      {invoice.host.suspendedUntil
                        ? fr.admin.signalementsSuspenduJusqu(formatDateShortFr(invoice.host.suspendedUntil))
                        : fr.admin.signalementsSuspendu}
                    </span>
                  ) : null}
                  <span className="ms-auto text-xs text-subtle">
                    {invoice.booking.property.title}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <span className="font-bold text-heading">
                    <Price amount={invoice.amount} />
                  </span>
                  <span className="text-xs text-muted">
                    {fr.admin.facturesColEcheance} : {formatDateShortFr(invoice.dueAt)}
                  </span>
                  {invoice.paidAt ? (
                    <span className="text-xs text-muted">
                      {fr.factures.payeLe(formatDateShortFr(invoice.paidAt))}
                    </span>
                  ) : invoice.lastReminderAt ? (
                    <span className="text-xs text-muted">
                      {fr.admin.facturesRelanceLe(formatDateShortFr(invoice.lastReminderAt))}
                    </span>
                  ) : null}
                </div>

                {invoice.status === "EN_ATTENTE" ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <form action={sendHostInvoiceReminderAction}>
                      <input type="hidden" name="invoiceId" value={invoice.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-darna/20 px-3 py-1 text-xs font-bold text-heading transition hover:bg-darna hover:text-white"
                      >
                        {fr.admin.facturesRelancer}
                      </button>
                    </form>
                    {hostSuspended ? (
                      <form action={reactivateUserAction}>
                        <input type="hidden" name="userId" value={invoice.host.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-darna/20 px-3 py-1 text-xs font-bold text-heading transition hover:bg-darna hover:text-white"
                        >
                          {fr.admin.reactiver}
                        </button>
                      </form>
                    ) : (
                      <ConfirmSubmitButton
                        action={suspendHostForInvoiceAction}
                        confirmMessage={fr.admin.facturesSuspendreConfirm}
                        hiddenFields={{ hostId: invoice.host.id, invoiceId: invoice.id }}
                        label={fr.admin.facturesSuspendre}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-bold text-red-700 transition hover:bg-red-600 hover:text-white"
                      />
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
