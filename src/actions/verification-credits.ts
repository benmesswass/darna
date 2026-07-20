"use server";

/**
 * Achat d'un lot de crédits de vérification Wakil (MONETISATION_IMMO_ROADMAP.md
 * §MI3). Deux chemins, comme partout ailleurs dans Darna :
 * `buyVerificationCreditPackDemoAction` (règlement DÉMO, aucun argent réel)
 * quand Konnect est désactivé, `startVerificationCreditPaymentAction`
 * (paiement Konnect réel, ponctuel) sinon. Miroir de
 * startFeaturedOrderPaymentAction (src/actions/properties.ts) : une ligne
 * PAR ACHAT (VerificationCreditOrder), contrairement à Subscription.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SITE_URL, FREE_VERIFICATION_CREDITS } from "@/lib/config";
import { verificationCreditPack } from "@/lib/verification-credits";
import { logAudit, logStructured } from "@/lib/audit";
import { initKonnectPayment, isKonnectEnabled, signKonnectWebhook } from "@/lib/konnect";

const packSchema = z.object({ pack: z.string().min(1).max(40) });

/**
 * Règlement DÉMO (aucun argent réel) : crédite le lot immédiatement. Ne
 * s'exécute JAMAIS quand Konnect est actif (même garde d'exclusivité que
 * subscribeAgencyPlanAction/confirmHostInvoiceAction).
 */
export async function buyVerificationCreditPackDemoAction(formData: FormData): Promise<void> {
  if (isKonnectEnabled()) return;

  const user = await requireUser();
  if (user.role !== "AGENCE") return;

  const parsed = packSchema.safeParse({ pack: formData.get("pack") });
  if (!parsed.success) return;
  const pack = verificationCreditPack(parsed.data.pack);
  if (!pack) return;

  await prisma.verificationWallet.upsert({
    where: { userId: user.id },
    create: { userId: user.id, balance: FREE_VERIFICATION_CREDITS + pack.credits },
    update: { balance: { increment: pack.credits } },
  });

  await logAudit({
    action: "VERIFICATION_CREDIT_PURCHASED",
    userId: user.id,
    success: true,
    metadata: { pack: pack.key, credits: pack.credits, amount: pack.priceTND, provider: "demo" },
  });

  revalidatePath("/dashboard/abonnement");
}

export type VerificationCreditPaymentState = { error?: string; payUrl?: string } | undefined;

/**
 * Démarre un paiement Konnect RÉEL pour un lot de crédits. Crée un
 * VerificationCreditOrder EN_ATTENTE, initialise le paiement, stocke le
 * paymentRef, renvoie payUrl (redirection CÔTÉ CLIENT, cf.
 * VerificationCreditPayButton). Le crédit n'est appliqué qu'au règlement
 * effectif (settleVerificationCreditOrder), JAMAIS ici.
 */
export async function startVerificationCreditPaymentAction(
  _prev: VerificationCreditPaymentState,
  formData: FormData
): Promise<VerificationCreditPaymentState> {
  const fr = await getT();
  const user = await requireUser();

  if (!isKonnectEnabled()) return { error: fr.common.erreurInconnue };
  // Réservé aux comptes agence — les particuliers ont la vérification gratuite.
  if (user.role !== "AGENCE") return { error: fr.common.erreurInconnue };

  const parsed = packSchema.safeParse({ pack: formData.get("pack") });
  if (!parsed.success) return { error: fr.common.erreurInconnue };
  const pack = verificationCreditPack(parsed.data.pack);
  if (!pack) return { error: fr.common.erreurInconnue };

  const order = await prisma.verificationCreditOrder.create({
    data: { ownerId: user.id, credits: pack.credits, amount: pack.priceTND },
  });

  const [firstName, ...rest] = user.name.trim().split(/\s+/);

  let payUrl: string;
  let paymentRef: string;
  try {
    const result = await initKonnectPayment({
      amountTND: pack.priceTND,
      orderId: order.id,
      description: `Darna — lot de ${pack.credits} vérifications Wakil`,
      // URL de webhook SIGNÉE : signKonnectWebhook signe une string générique
      // (pas spécifiquement un bookingId) — réutilisable telle quelle pour un
      // VerificationCreditOrder.id (même principe que les webhooks FeaturedOrder/Subscription).
      webhook: `${SITE_URL}/api/payments/konnect/verification-credit-webhook?vid=${order.id}&sig=${signKonnectWebhook(order.id)}`,
      successUrl: `${SITE_URL}/dashboard/abonnement?konnect=success&vid=${order.id}`,
      failUrl: `${SITE_URL}/dashboard/abonnement?konnect=fail&vid=${order.id}`,
      lifespanMinutes: 60,
      firstName: firstName || user.name,
      lastName: rest.join(" ") || undefined,
      email: user.email,
      phoneNumber: user.phone ?? undefined,
    });
    payUrl = result.payUrl;
    paymentRef = result.paymentRef;
  } catch (err) {
    logStructured("error", "konnect.verification_credit_init_failed", {
      orderId: order.id,
      userId: user.id,
      error: (err as Error).message,
    });
    await logAudit({
      action: "VERIFICATION_CREDIT_PAYMENT_FAILED",
      userId: user.id,
      success: false,
      metadata: { orderId: order.id, stage: "init" },
    });
    return { error: fr.abonnement.paiementErreur };
  }

  await prisma.verificationCreditOrder.update({ where: { id: order.id }, data: { paymentRef } });

  await logAudit({
    action: "VERIFICATION_CREDIT_PAYMENT_INITIATED",
    userId: user.id,
    success: true,
    metadata: {
      orderId: order.id,
      paymentRef,
      pack: pack.key,
      credits: pack.credits,
      amount: pack.priceTND,
      provider: "konnect",
    },
  });

  return { payUrl };
}
