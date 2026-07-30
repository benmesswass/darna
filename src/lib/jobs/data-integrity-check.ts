import { prisma } from "@/lib/prisma";
import { captureError } from "@/lib/observability";

/**
 * Balayage d'intégrité des données (ROADMAP.md §P5.2) — détecte des
 * incohérences silencieuses qui ne devraient JAMAIS survenir en
 * fonctionnement normal (les FK ci-dessous sont déjà appliquées par
 * Postgres/Prisma — un résultat non nul ici signale soit une manipulation
 * hors application, soit un bug de migration, jamais un cas d'usage
 * normal). Lecture seule : ce job ne corrige rien, il alerte
 * (`captureError`) pour investigation manuelle. Sur un produit financier,
 * une corruption silencieuse coûte plus cher qu'une panne visible.
 */

/** Différence par ensemble (pas de SQL brut) : les FK sont déjà appliquées
 *  par Postgres, donc un résultat non vide signale une anomalie réelle. */
function orphanIds(childRefs: string[], parentIds: string[]): string[] {
  const parentSet = new Set(parentIds);
  return childRefs.filter((id) => !parentSet.has(id));
}

async function checkOrphanBookingProperties(): Promise<string[]> {
  const [bookings, properties] = await Promise.all([
    prisma.booking.findMany({ distinct: ["propertyId"], select: { propertyId: true } }),
    prisma.property.findMany({ select: { id: true } }),
  ]);
  return orphanIds(
    bookings.map((b) => b.propertyId),
    properties.map((p) => p.id)
  );
}

async function checkOrphanBookingGuests(): Promise<string[]> {
  const [bookings, users] = await Promise.all([
    prisma.booking.findMany({ distinct: ["guestId"], select: { guestId: true } }),
    prisma.user.findMany({ select: { id: true } }),
  ]);
  return orphanIds(
    bookings.map((b) => b.guestId),
    users.map((u) => u.id)
  );
}

async function checkOrphanHostInvoiceBookings(): Promise<string[]> {
  const [invoices, bookings] = await Promise.all([
    prisma.hostInvoice.findMany({ select: { bookingId: true } }),
    prisma.booking.findMany({ select: { id: true } }),
  ]);
  return orphanIds(
    invoices.map((i) => i.bookingId),
    bookings.map((b) => b.id)
  );
}

/**
 * `escrow` (Booking) reste inerte tant que le vrai séquestre en ligne (V2,
 * CLAUDE.md §Paiement Konnect) n'est pas construit — AUCUN code aujourd'hui
 * ne le fait sortir de "AUCUN". Une valeur différente est donc un signal
 * fort (bug, ou test d'une fonctionnalité pas censée être atteignable).
 */
async function checkEscrowAnomalies(): Promise<number> {
  return prisma.booking.count({ where: { escrow: { not: "AUCUN" } } });
}

/**
 * CreditWallet.balance est mis à jour ATOMIQUEMENT avec chaque
 * CreditTransaction (cf. schema.prisma) — la somme du ledger APPEND-ONLY
 * doit donc toujours égaler le solde stocké. Une divergence signale un
 * chemin de code qui a touché l'un sans l'autre.
 */
async function checkCreditLedgerMismatches(): Promise<
  Array<{ walletId: string; balance: number; ledgerSum: number }>
> {
  const [wallets, sums] = await Promise.all([
    prisma.creditWallet.findMany({ select: { id: true, balance: true } }),
    prisma.creditTransaction.groupBy({ by: ["walletId"], _sum: { amount: true } }),
  ]);
  const sumByWallet = new Map(sums.map((s) => [s.walletId, s._sum.amount ?? 0]));

  return wallets
    .map((w) => ({ walletId: w.id, balance: w.balance, ledgerSum: sumByWallet.get(w.id) ?? 0 }))
    .filter((w) => w.balance !== w.ledgerSum);
}

export async function checkDataIntegrity(): Promise<Record<string, unknown>> {
  const [orphanProperties, orphanGuests, orphanInvoices, escrowAnomalies, creditMismatches] =
    await Promise.all([
      checkOrphanBookingProperties(),
      checkOrphanBookingGuests(),
      checkOrphanHostInvoiceBookings(),
      checkEscrowAnomalies(),
      checkCreditLedgerMismatches(),
    ]);

  const findings = {
    orphanBookingProperties: orphanProperties,
    orphanBookingGuests: orphanGuests,
    orphanHostInvoiceBookings: orphanInvoices,
    escrowAnomalyCount: escrowAnomalies,
    creditLedgerMismatches: creditMismatches,
  };

  const totalIssues =
    orphanProperties.length +
    orphanGuests.length +
    orphanInvoices.length +
    escrowAnomalies +
    creditMismatches.length;

  if (totalIssues > 0) {
    await captureError(new Error("Incohérence(s) d'intégrité de données détectée(s)"), {
      event: "data_integrity_check.findings",
      ...findings,
    });
  }

  return { totalIssues, ...findings };
}
