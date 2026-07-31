"use server";

/**
 * Souscription / renouvellement de l'abonnement agence
 * (MONETISATION_IMMO_ROADMAP.md §MI2). Deux chemins, comme partout ailleurs
 * dans Darna : `subscribeAgencyPlanAction` (règlement DÉMO, aucun argent
 * réel) quand Konnect est désactivé, `startSubscriptionPaymentAction`
 * (paiement Konnect réel, ponctuel — pas d'abonnement récurrent auto-débité,
 * Konnect ne le supporte pas nativement) sinon. Contrairement à
 * HostInvoice/FeaturedOrder, aucun id n'est reçu du client : l'action opère
 * TOUJOURS sur l'abonnement de l'utilisateur connecté (relation 1:1
 * userId unique) — pas de surface IDOR possible ici.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SITE_URL, SUBSCRIPTION_DURATION_DAYS, FREE_VERIFICATION_CREDITS } from "@/lib/config";
import { agencyPlan } from "@/lib/subscriptions";
import { logAudit, logStructured } from "@/lib/audit";
import { initKonnectPayment, isKonnectEnabled, signKonnectWebhook } from "@/lib/konnect";
import { growthMonetizationEnabled } from "@/lib/modes";

const planSchema = z.object({ plan: z.string().min(1).max(40) });

/**
 * Règlement DÉMO (aucun argent réel) : active/renouvelle l'abonnement
 * immédiatement. Ne s'exécute JAMAIS quand Konnect est actif (même garde
 * d'exclusivité que confirmHostInvoiceAction/featureListingAction).
 */
export async function subscribeAgencyPlanAction(formData: FormData): Promise<void> {
  if (isKonnectEnabled()) return;
  // P6.2 (ROADMAP.md) : achat masqué avant lancement — défense en profondeur.
  if (!growthMonetizationEnabled()) return;

  const user = await requireUser();
  if (user.role !== "AGENCE") return;

  const parsed = planSchema.safeParse({ plan: formData.get("plan") });
  if (!parsed.success) return;
  const plan = agencyPlan(parsed.data.plan);
  if (!plan) return;

  const existing = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: { currentPeriodEnd: true, starterBonusGranted: true },
  });
  // Prolongation : on part de la fin de période restante si elle est future
  // (même logique que le boost « à la une »), sinon d'aujourd'hui.
  const base =
    existing?.currentPeriodEnd && existing.currentPeriodEnd.getTime() > Date.now()
      ? existing.currentPeriodEnd.getTime()
      : Date.now();
  const currentPeriodEnd = new Date(base + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  // freeBoostUsedAt reset à null : nouveau cycle à chaque souscription/
  // renouvellement, même mécanique que le règlement Konnect réel (MI4,
  // cf. settleSubscriptionPayment).
  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, plan: plan.key, status: "ACTIF", currentPeriodEnd, freeBoostUsedAt: null },
    update: { plan: plan.key, status: "ACTIF", currentPeriodEnd, freeBoostUsedAt: null },
  });

  // Bonus de crédits de vérification du palier (MI3, décision Wassim du
  // 2026-07-20) : accordé UNE SEULE FOIS par compte — jamais reconduit aux
  // renouvellements. Générique (ne dépend pas d'un nom de palier en dur).
  if (plan.verificationCreditsBonus > 0 && !existing?.starterBonusGranted) {
    await prisma.verificationWallet.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        balance: FREE_VERIFICATION_CREDITS + plan.verificationCreditsBonus,
      },
      update: { balance: { increment: plan.verificationCreditsBonus } },
    });
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { starterBonusGranted: true },
    });
  }

  await logAudit({
    action: "AGENCY_SUBSCRIPTION_PAID",
    userId: user.id,
    success: true,
    metadata: {
      plan: plan.key,
      amount: plan.priceTND,
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      provider: "demo",
    },
  });

  revalidatePath("/dashboard/abonnement");
}

export type SubscriptionPaymentState = { error?: string; payUrl?: string } | undefined;

/**
 * Démarre un paiement Konnect RÉEL de souscription/renouvellement. Miroir de
 * startFeaturedOrderPaymentAction (src/actions/properties.ts) : initialise le
 * paiement, stocke le paymentRef, renvoie payUrl (redirection CÔTÉ CLIENT,
 * cf. SubscriptionPayButton — compat CSP form-action 'self'). L'effet métier
 * (status ACTIF + currentPeriodEnd) n'a lieu qu'au règlement effectif
 * (settleSubscriptionPayment), jamais ici.
 */
export async function startSubscriptionPaymentAction(
  _prev: SubscriptionPaymentState,
  formData: FormData
): Promise<SubscriptionPaymentState> {
  const fr = await getT();
  const user = await requireUser();

  if (!isKonnectEnabled()) return { error: fr.common.erreurInconnue };
  // P6.2 (ROADMAP.md) : achat masqué avant lancement — défense en profondeur.
  if (!growthMonetizationEnabled()) return { error: fr.common.erreurInconnue };
  // Réservé aux comptes agence — le mécanisme d'abonnement ne cible pas les
  // hôtes individuels (cf. roadmap §MI1).
  if (user.role !== "AGENCE") return { error: fr.common.erreurInconnue };

  const parsed = planSchema.safeParse({ plan: formData.get("plan") });
  if (!parsed.success) return { error: fr.common.erreurInconnue };
  const plan = agencyPlan(parsed.data.plan);
  if (!plan) return { error: fr.common.erreurInconnue };

  const subscription = await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, plan: plan.key, status: "EN_ATTENTE" },
    update: { plan: plan.key },
    select: { id: true },
  });

  const [firstName, ...rest] = user.name.trim().split(/\s+/);

  let payUrl: string;
  let paymentRef: string;
  try {
    const result = await initKonnectPayment({
      amountTND: plan.priceTND,
      orderId: subscription.id,
      description: `Darna — abonnement agence (${plan.label})`,
      // URL de webhook SIGNÉE : signKonnectWebhook signe une string générique
      // (pas spécifiquement un bookingId) — réutilisable telle quelle pour un
      // subscriptionId (même principe que le webhook FeaturedOrder).
      webhook: `${SITE_URL}/api/payments/konnect/subscription-webhook?sid=${subscription.id}&sig=${signKonnectWebhook(subscription.id)}`,
      successUrl: `${SITE_URL}/dashboard/abonnement?konnect=success`,
      failUrl: `${SITE_URL}/dashboard/abonnement?konnect=fail`,
      // Pas de hold à expiration courte (contrairement au hold de réservation
      // voyageur) : durée de vie généreuse et fixe du lien de paiement.
      lifespanMinutes: 60,
      firstName: firstName || user.name,
      lastName: rest.join(" ") || undefined,
      email: user.email,
      phoneNumber: user.phone ?? undefined,
    });
    payUrl = result.payUrl;
    paymentRef = result.paymentRef;
  } catch (err) {
    logStructured("error", "konnect.subscription_init_failed", {
      subscriptionId: subscription.id,
      userId: user.id,
      error: (err as Error).message,
    });
    await logAudit({
      action: "AGENCY_SUBSCRIPTION_PAYMENT_FAILED",
      userId: user.id,
      success: false,
      metadata: { subscriptionId: subscription.id, stage: "init" },
    });
    return { error: fr.abonnement.paiementErreur };
  }

  await prisma.subscription.update({ where: { id: subscription.id }, data: { paymentRef } });

  await logAudit({
    action: "AGENCY_SUBSCRIPTION_PAYMENT_INITIATED",
    userId: user.id,
    success: true,
    metadata: {
      subscriptionId: subscription.id,
      paymentRef,
      plan: plan.key,
      amount: plan.priceTND,
      provider: "konnect",
    },
  });

  return { payUrl };
}
