/**
 * Règlement d'un paiement d'abonnement agence via Konnect
 * (MONETISATION_IMMO_ROADMAP.md §MI2). Logique partagée entre le webhook
 * dédié et la page de retour (`?konnect=success`), en miroir de
 * `src/lib/featured-payments.ts` (settleFeaturedOrder) — avec une différence
 * structurelle importante : `Subscription` est une ligne UNIQUE réutilisée à
 * CHAQUE cycle (souscription initiale ET renouvellements), contrairement à
 * FeaturedOrder qui crée une nouvelle ligne par achat. L'idempotence contre
 * la course webhook/retour ne peut donc pas reposer sur `status` (qui reste
 * ACTIF d'un cycle à l'autre) : elle repose sur `paymentRef`, remis à null
 * dès le règlement — un règlement concurrent pour la MÊME référence ne peut
 * donc jamais s'appliquer deux fois, et un ancien `paymentRef` rejoué après
 * coup ne correspond simplement plus à rien (INTROUVABLE).
 *
 * Module serveur uniquement (importe prisma + secrets Konnect).
 */

import { prisma } from "@/lib/prisma";
import { getKonnectPayment, tndToMillimes } from "@/lib/konnect";
import { SUBSCRIPTION_DURATION_DAYS, FREE_VERIFICATION_CREDITS } from "@/lib/config";
import { agencyPlan } from "@/lib/subscriptions";
import { logAudit, logStructured } from "@/lib/audit";

export type SettleSubscriptionResult =
  | "ACTIF" // réglé (effet appliqué ou déjà appliqué)
  | "EN_ATTENTE" // paiement pas encore abouti côté Konnect, ou rien à vérifier
  | "INTROUVABLE" // aucun abonnement pour cette référence
  | "ERREUR"; // échec technique, palier inconnu, ou montant incohérent

export async function settleSubscriptionPayment(
  ref: { subscriptionId: string } | { paymentRef: string }
): Promise<SettleSubscriptionResult> {
  const subscription = await prisma.subscription.findFirst({
    where: "subscriptionId" in ref ? { id: ref.subscriptionId } : { paymentRef: ref.paymentRef },
    select: {
      id: true,
      userId: true,
      plan: true,
      status: true,
      currentPeriodEnd: true,
      paymentRef: true,
      starterBonusGranted: true,
    },
  });

  if (!subscription) return "INTROUVABLE";

  // Rien à vérifier : aucun paiement en cours pour cet abonnement (déjà
  // réglé par la requête concurrente, ou jamais initié).
  if (!subscription.paymentRef) return "EN_ATTENTE";

  const plan = agencyPlan(subscription.plan);
  if (!plan) {
    logStructured("error", "konnect.subscription_unknown_plan", {
      subscriptionId: subscription.id,
      plan: subscription.plan,
    });
    return "ERREUR";
  }

  let payment;
  try {
    payment = await getKonnectPayment(subscription.paymentRef);
  } catch (err) {
    logStructured("error", "konnect.subscription_settle_fetch_failed", {
      subscriptionId: subscription.id,
      error: (err as Error).message,
    });
    return "ERREUR";
  }

  if (payment.status !== "completed") return "EN_ATTENTE";

  // Contrôle d'intégrité : montant réellement reçu jamais inférieur au prix
  // du palier — toujours recalculé côté serveur depuis AGENCY_PLANS, jamais
  // un montant transmis par le client.
  const expectedMillimes = tndToMillimes(plan.priceTND);
  if (payment.reachedAmount < expectedMillimes) {
    logStructured("warn", "konnect.subscription_amount_mismatch", {
      subscriptionId: subscription.id,
      expectedMillimes,
      reachedAmount: payment.reachedAmount,
    });
    return "ERREUR";
  }

  // Règlement atomique, keyed sur la référence PRÉCISE en cours de
  // vérification (pas sur `status`, cf. commentaire d'en-tête) : ne mute que
  // si `paymentRef` n'a pas déjà été consommé par une requête concurrente.
  const base =
    subscription.currentPeriodEnd && subscription.currentPeriodEnd.getTime() > Date.now()
      ? subscription.currentPeriodEnd.getTime()
      : Date.now();
  const currentPeriodEnd = new Date(base + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const updated = await prisma.subscription.updateMany({
    where: { id: subscription.id, paymentRef: subscription.paymentRef },
    data: { status: "ACTIF", currentPeriodEnd, paymentRef: null },
  });
  if (updated.count === 0) return "ACTIF";

  // Bonus de crédits de vérification du palier (MI3, décision Wassim du
  // 2026-07-20) : accordé UNE SEULE FOIS par compte, jamais reconduit aux
  // renouvellements (cf. Subscription.starterBonusGranted). Générique — ne
  // dépend pas d'un nom de palier en dur, seulement de `verificationCreditsBonus`
  // (aujourd'hui non nul uniquement pour Starter).
  if (plan.verificationCreditsBonus > 0 && !subscription.starterBonusGranted) {
    await prisma.verificationWallet.upsert({
      where: { userId: subscription.userId },
      create: {
        userId: subscription.userId,
        balance: FREE_VERIFICATION_CREDITS + plan.verificationCreditsBonus,
      },
      update: { balance: { increment: plan.verificationCreditsBonus } },
    });
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { starterBonusGranted: true },
    });
  }

  await logAudit({
    action: "AGENCY_SUBSCRIPTION_PAID",
    userId: subscription.userId,
    success: true,
    metadata: {
      subscriptionId: subscription.id,
      plan: plan.key,
      amount: plan.priceTND,
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      provider: "konnect",
    },
  });

  return "ACTIF";
}
