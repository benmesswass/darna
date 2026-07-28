import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatDateShortFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { markRefundPaidAction, creditRefundAction } from "@/actions/admin";
import { CoinsIcon } from "@/components/icons";
import { ConfirmSubmitButton } from "@/components/dashboard/ConfirmSubmitButton";

/**
 * Dashboard admin des remboursements dus (LANCEMENT_ROADMAP.md §L5.2) —
 * l'API Konnect n'a pas de remboursement programmatique (CLAUDE.md §AHC8) :
 * chaque réservation annulée avec `refundAmount` non nul attend un règlement
 * MANUEL, en crédits Darna (préféré, instantané) ou par virement (fallback).
 * Réservé ADMIN.
 */
export default async function AdminRemboursementsPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const bookings = await prisma.booking.findMany({
    where: { refundAmount: { not: null }, refundPaidAt: null },
    orderBy: { cancelledAt: "asc" },
    select: {
      id: true,
      refundAmount: true,
      cancelledAt: true,
      guest: { select: { name: true, email: true } },
      property: { select: { title: true } },
    },
  });

  const totalDu = bookings.reduce((sum, b) => sum + (b.refundAmount ?? 0), 0);

  return (
    <div>
      <h3 className="flex items-center gap-2 text-lg font-bold text-heading">
        <CoinsIcon width={18} height={18} className="text-sand" />
        {fr.admin.remboursementsTitre}
      </h3>
      <p className="mt-1 text-sm text-muted">{fr.admin.remboursementsSousTitre}</p>

      <div className="mt-5 rounded-2xl bg-surface p-4 ring-1 ring-darna/10 sm:w-64">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {fr.admin.remboursementsTotalDu}
        </p>
        <p className="mt-1 text-2xl font-bold text-heading">
          <Price amount={totalDu} />
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-surface p-10 text-center ring-1 ring-darna/10">
          <p className="text-sm text-muted">{fr.admin.remboursementsVide}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="rounded-2xl bg-surface p-4 text-start ring-1 ring-darna/10"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-body">{booking.guest.name}</span>
                <span className="text-xs text-muted">{booking.guest.email}</span>
                <span className="ms-auto text-xs text-subtle">{booking.property.title}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                <span className="font-bold text-heading">
                  <Price amount={booking.refundAmount ?? 0} />
                </span>
                {booking.cancelledAt ? (
                  <span className="text-xs text-muted">
                    {fr.admin.remboursementsColAnnule} : {formatDateShortFr(booking.cancelledAt)}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <ConfirmSubmitButton
                  action={creditRefundAction}
                  confirmMessage={fr.admin.remboursementsCrediterConfirm}
                  hiddenFields={{ bookingId: booking.id }}
                  label={fr.admin.remboursementsCrediter}
                  className="rounded-full bg-darna px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-darna-light"
                />
                <ConfirmSubmitButton
                  action={markRefundPaidAction}
                  confirmMessage={fr.admin.remboursementsMarquerVirementConfirm}
                  hiddenFields={{ bookingId: booking.id }}
                  label={fr.admin.remboursementsMarquerVirement}
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
