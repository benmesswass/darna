import { prisma } from "@/lib/prisma";
import { captureError } from "@/lib/observability";
import { ensureHostInvoiceReminders } from "@/lib/notification-center";
import { HOST_INVOICE_DUE_SOON_DAYS } from "@/lib/config";

/**
 * Job de rappels de factures hôte (LANCEMENT_ROADMAP.md §L3.4,
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP5) — déclenche pour TOUS les hôtes
 * concernés ce que `ensureHostInvoiceReminders` (détection paresseuse,
 * `src/lib/notification-center.ts`) ne déclenchait qu'au hasard d'une
 * connexion (LIMITE ASSUMÉE de PSP5, levée ici). Réutilise ENTIÈREMENT la
 * fonction existante — notification, e-mail et dédoublonnage par index
 * unique partiel (migration 20260707170000) sont déjà en place — cette
 * fonction se contente de trouver la liste des hôtes à couvrir.
 */
export async function remindHostInvoices(): Promise<{ hostsChecked: number }> {
  const soon = new Date(Date.now() + HOST_INVOICE_DUE_SOON_DAYS * 24 * 60 * 60 * 1000);

  const rows = await prisma.hostInvoice.findMany({
    where: { status: "EN_ATTENTE", dueAt: { lte: soon } },
    select: { hostId: true },
    distinct: ["hostId"],
  });

  for (const { hostId } of rows) {
    try {
      await ensureHostInvoiceReminders(hostId);
    } catch (err) {
      // ensureHostInvoiceReminders isole déjà ses erreurs par facture — ce
      // filet ne couvre qu'un échec plus global (ex. requête DB ponctuelle).
      await captureError(err, { entity: "HostInvoice", hostId, phase: "invoice_reminder" });
    }
  }

  return { hostsChecked: rows.length };
}
