import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { settleHostInvoice } from "@/lib/host-invoicing";
import { isKonnectEnabled } from "@/lib/konnect";
import { confirmHostInvoiceAction } from "@/actions/host-invoices";
import { PayHostInvoiceButton } from "@/components/dashboard/PayHostInvoiceButton";
import { formatDateFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { ShieldIcon } from "@/components/icons";
import { SuccessCheck } from "@/components/ui/SuccessCheck";

export const metadata: Metadata = { title: frMeta.factures.titre };

/**
 * Page de règlement d'une HostInvoice unique (PAIEMENT_SUR_PLACE_ROADMAP.md
 * §PSP4) — miroir de /reservation/[id]/paiement pour la réservation voyageur.
 * Volontairement UNE facture à la fois (pas de liste) : le tableau de bord
 * listant toutes les factures avec rappels est le scope dédié de §PSP5.
 */
export default async function FactureHotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ konnect?: string }>;
}) {
  const fr = await getT();
  const { id } = await params;
  const { konnect } = await searchParams;

  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const konnectEnabled = isKonnectEnabled();

  const invoiceSelect = {
    id: true,
    hostId: true,
    status: true,
    amount: true,
    dueAt: true,
    paidAt: true,
    booking: {
      select: {
        checkIn: true,
        checkOut: true,
        property: { select: { title: true, city: true } },
      },
    },
  } as const;

  let invoice = await prisma.hostInvoice.findUnique({ where: { id }, select: invoiceSelect });
  // Autorisation : la facture appartient bien à l'hôte connecté (IDOR).
  if (!invoice || invoice.hostId !== user.id) notFound();

  // Retour de la passerelle Konnect : on règle (idempotent) avant l'affichage,
  // filet de sécurité si le webhook n'a pas (encore) abouti — indispensable en
  // dev local où Konnect ne joint pas localhost (même patron que la page de
  // paiement voyageur, src/app/reservation/[id]/paiement/page.tsx).
  if (konnectEnabled && konnect === "success" && invoice.status === "EN_ATTENTE") {
    await settleHostInvoice({ invoiceId: id });
    invoice = await prisma.hostInvoice.findUnique({ where: { id }, select: invoiceSelect });
    if (!invoice) notFound();
  }

  const paid = invoice.status === "PAYEE";

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {paid ? (
        <div className="rounded-3xl bg-surface p-8 text-center ring-1 ring-emerald-200">
          <SuccessCheck size={64} />
          <h1 className="mt-5 text-2xl font-bold text-heading">{fr.factures.statutPayee}</h1>
          <div className="mt-5 rounded-2xl bg-cream p-4 text-start text-sm">
            <p className="font-semibold text-body">{invoice.booking.property.title}</p>
            <p className="text-muted">{invoice.booking.property.city}</p>
            <dl className="mt-3 space-y-1.5">
              <div className="flex justify-between">
                <dt className="text-muted">{fr.factures.montantDu}</dt>
                <dd>
                  <Price amount={invoice.amount} className="font-semibold text-body" />
                </dd>
              </div>
              {invoice.paidAt ? (
                <div className="flex justify-between">
                  <dt className="text-muted">{fr.factures.payeLe(formatDateFr(invoice.paidAt))}</dt>
                  <dd />
                </div>
              ) : null}
            </dl>
          </div>
          <Link
            href="/dashboard/reservations"
            className="mt-6 inline-block rounded-full bg-darna px-7 py-3 text-sm font-bold text-white hover:bg-darna-light"
          >
            {fr.booking.voirMesReservations}
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl bg-surface p-8 ring-1 ring-darna/10">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-heading">
            <ShieldIcon width={24} height={24} className="text-sand" />
            {fr.factures.titre}
          </h1>

          <div className="mt-5 rounded-2xl bg-cream p-4 text-sm">
            <p className="font-semibold text-body">
              {fr.factures.commissionPour(invoice.booking.property.title)}
            </p>
            <p className="mt-1 text-muted">
              {invoice.booking.property.city} ·{" "}
              {fr.booking.sejourDates(
                formatDateFr(invoice.booking.checkIn),
                formatDateFr(invoice.booking.checkOut)
              )}
            </p>
            <dl className="mt-3 space-y-1.5">
              <div className="flex justify-between">
                <dt className="font-semibold text-heading">{fr.factures.montantDu}</dt>
                <dd>
                  <Price amount={invoice.amount} className="text-base font-bold text-heading" />
                </dd>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <dt>{fr.factures.echeance(formatDateFr(invoice.dueAt))}</dt>
                <dd />
              </div>
            </dl>
          </div>

          {konnectEnabled && konnect === "fail" ? (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
            >
              {fr.factures.paiementEchoue}
            </p>
          ) : konnectEnabled && konnect === "success" ? (
            <p className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-sand-light/50 px-4 py-2.5 text-sm font-medium text-darna-dark">
              {fr.factures.paiementEnVerification}
              <Link href={`/dashboard/factures/${invoice.id}`} className="shrink-0 font-bold underline">
                {fr.factures.actualiser}
              </Link>
            </p>
          ) : null}

          {konnectEnabled ? (
            <PayHostInvoiceButton invoiceId={invoice.id} />
          ) : (
            <form action={confirmHostInvoiceAction} className="mt-5">
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <button
                type="submit"
                className="w-full rounded-2xl bg-sand px-6 py-3.5 text-base font-bold text-darna-dark transition hover:bg-sand-light"
              >
                {fr.factures.payerSimulation}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
