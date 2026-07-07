"use server";

/**
 * Règlement de la facture hôte (commission Rail 2, paiement sur place —
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP4). Miroir du flux de paiement voyageur
 * (`src/actions/bookings.ts` — startKonnectPaymentAction/confirmPaymentAction),
 * appliqué à `HostInvoice` plutôt qu'à `Booking`.
 */

import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SITE_URL } from "@/lib/config";
import { logAudit, logStructured } from "@/lib/audit";
import { initKonnectPayment, isKonnectEnabled, signKonnectWebhook } from "@/lib/konnect";
import { revalidatePath } from "next/cache";

export type HostInvoicePaymentState = { error?: string; payUrl?: string } | undefined;

const invoiceIdSchema = z.object({ invoiceId: z.string().cuid() });

/**
 * Initialise le paiement Konnect de la facture. Redirection faite CÔTÉ CLIENT
 * (cf. PayHostInvoiceButton, même raison que KonnectPayButton : compat CSP
 * `form-action 'self'`).
 */
export async function payHostInvoiceAction(
  _prev: HostInvoicePaymentState,
  formData: FormData
): Promise<HostInvoicePaymentState> {
  const fr = await getT();
  const user = await requireUser();

  if (!isKonnectEnabled()) return { error: fr.common.erreurInconnue };

  const parsed = invoiceIdSchema.safeParse({ invoiceId: formData.get("invoiceId") });
  if (!parsed.success) return { error: fr.common.erreurInconnue };

  const invoice = await prisma.hostInvoice.findUnique({
    where: { id: parsed.data.invoiceId },
    select: {
      id: true,
      hostId: true,
      status: true,
      amount: true,
      booking: { select: { property: { select: { title: true } } } },
    },
  });

  // Autorisation stricte : seul l'hôte titulaire de la facture peut la régler (IDOR).
  if (!invoice || invoice.hostId !== user.id) return { error: fr.common.erreurInconnue };
  if (invoice.status !== "EN_ATTENTE") return { error: fr.factures.factureIndisponible };

  const [firstName, ...rest] = user.name.trim().split(/\s+/);

  let payUrl: string;
  let paymentRef: string;
  try {
    const result = await initKonnectPayment({
      amountTND: invoice.amount,
      orderId: invoice.id,
      description: `Darna — commission ${invoice.booking.property.title}`,
      // URL de webhook SIGNÉE : signKonnectWebhook signe une string générique
      // (pas spécifiquement un bookingId) — réutilisable telle quelle pour un
      // invoiceId (cf. commentaire dans src/lib/konnect.ts).
      webhook: `${SITE_URL}/api/payments/konnect/host-invoice-webhook?iid=${invoice.id}&sig=${signKonnectWebhook(invoice.id)}`,
      successUrl: `${SITE_URL}/dashboard/factures/${invoice.id}?konnect=success`,
      failUrl: `${SITE_URL}/dashboard/factures/${invoice.id}?konnect=fail`,
      // Pas de hold à expiration courte côté HostInvoice (contrairement au
      // hold de réservation) : durée de vie généreuse et fixe du lien de paiement.
      lifespanMinutes: 60,
      firstName: firstName || user.name,
      lastName: rest.join(" ") || undefined,
      email: user.email,
      phoneNumber: user.phone ?? undefined,
    });
    payUrl = result.payUrl;
    paymentRef = result.paymentRef;
  } catch (err) {
    logStructured("error", "konnect.host_invoice_init_failed", {
      invoiceId: invoice.id,
      userId: user.id,
      error: (err as Error).message,
    });
    await logAudit({
      action: "HOST_INVOICE_PAYMENT_FAILED",
      userId: user.id,
      success: false,
      metadata: { invoiceId: invoice.id, stage: "init" },
    });
    return { error: fr.factures.paiementErreur };
  }

  await prisma.hostInvoice.update({
    where: { id: invoice.id },
    data: { paymentRef },
  });

  await logAudit({
    action: "HOST_INVOICE_PAYMENT_INITIATED",
    userId: user.id,
    success: true,
    metadata: { invoiceId: invoice.id, paymentRef, amount: invoice.amount, provider: "konnect" },
  });

  return { payUrl };
}

/**
 * Règlement DÉMO (séquestre simulé, aucun argent réel) — miroir de
 * confirmPaymentAction (signature simple `(formData) => Promise<void>`,
 * échec silencieux : la page se recharge sur son état réel via
 * `revalidatePath`, pas besoin d'un message d'erreur dédié pour ce chemin
 * démo). Ne s'exécute JAMAIS quand Konnect est actif (même garde
 * d'exclusivité que le flux réservation : anti-confusion démo/réel).
 */
export async function confirmHostInvoiceAction(formData: FormData): Promise<void> {
  if (isKonnectEnabled()) return;

  const user = await requireUser();
  const parsed = invoiceIdSchema.safeParse({ invoiceId: formData.get("invoiceId") });
  if (!parsed.success) return;

  const invoice = await prisma.hostInvoice.findUnique({
    where: { id: parsed.data.invoiceId },
    select: { id: true, hostId: true, status: true, amount: true },
  });

  if (!invoice || invoice.hostId !== user.id) return;
  if (invoice.status !== "EN_ATTENTE") return;

  const updated = await prisma.hostInvoice.updateMany({
    where: { id: invoice.id, status: "EN_ATTENTE" },
    data: { status: "PAYEE", paidAt: new Date() },
  });
  if (updated.count === 0) return;

  await logAudit({
    action: "HOST_INVOICE_PAID",
    userId: user.id,
    success: true,
    metadata: { invoiceId: invoice.id, amount: invoice.amount, provider: "demo" },
  });

  revalidatePath(`/dashboard/factures/${invoice.id}`);
}
