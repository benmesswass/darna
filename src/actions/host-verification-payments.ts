"use server";

/**
 * Paiement de la vérification Wakil pour un compte HOTE (particulier) —
 * MONETISATION_IMMO_ROADMAP.md §MI3, décision Wassim du 2026-07-20 : régime
 * DIFFÉRENT de l'agence, volontairement — AUCUNE vérification gratuite,
 * paiement À L'UNITÉ (toujours exactement 1 crédit, HOST_VERIFICATION_PRICE_TND),
 * jamais de lot. Réutilise intégralement l'infrastructure MI3 déjà en place
 * (VerificationCreditOrder, settleVerificationCreditOrder, le webhook
 * verification-credit-webhook — tous génériques, indifférents au rôle du
 * propriétaire) : seule la façon d'obtenir un crédit diffère de l'agence.
 *
 * Deux chemins, comme partout ailleurs dans Darna : `payHostVerificationDemoAction`
 * (règlement DÉMO, aucun argent réel) quand Konnect est désactivé,
 * `startHostVerificationPaymentAction` (paiement Konnect réel, ponctuel) sinon.
 */

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SITE_URL, HOST_VERIFICATION_PRICE_TND } from "@/lib/config";
import { logAudit, logStructured } from "@/lib/audit";
import { initKonnectPayment, isKonnectEnabled, signKonnectWebhook } from "@/lib/konnect";

/**
 * Règlement DÉMO (aucun argent réel) : crédite 1 vérification immédiatement.
 * Ne s'exécute JAMAIS quand Konnect est actif (même garde d'exclusivité que
 * buyVerificationCreditPackDemoAction/confirmHostInvoiceAction). Signature
 * `useActionState` (au lieu d'une simple action de formulaire) pour que le
 * bouton (HostVerificationDemoPayButton) puisse afficher un état pending —
 * la page se recharge sinon sans aucun retour visible pendant l'aller-retour.
 */
export async function payHostVerificationDemoAction(_prev: undefined): Promise<undefined> {
  if (isKonnectEnabled()) return undefined;

  const user = await requireUser();
  if (user.role !== "HOTE") return undefined;

  await prisma.verificationWallet.upsert({
    where: { userId: user.id },
    create: { userId: user.id, balance: 1 },
    update: { balance: { increment: 1 } },
  });

  await logAudit({
    action: "VERIFICATION_CREDIT_PURCHASED",
    userId: user.id,
    success: true,
    metadata: { credits: 1, amount: HOST_VERIFICATION_PRICE_TND, provider: "demo", payer: "HOTE" },
  });

  revalidatePath("/dashboard/annonces");
}

export type HostVerificationPaymentState = { error?: string; payUrl?: string } | undefined;

/**
 * Démarre un paiement Konnect RÉEL pour UNE vérification (jamais de lot).
 * Crée un VerificationCreditOrder EN_ATTENTE (credits=1, amount=
 * HOST_VERIFICATION_PRICE_TND), initialise le paiement, stocke le paymentRef,
 * renvoie payUrl. Le crédit n'est appliqué qu'au règlement effectif
 * (settleVerificationCreditOrder, webhook partagé avec les lots agence),
 * JAMAIS ici.
 */
export async function startHostVerificationPaymentAction(
  _prev: HostVerificationPaymentState
): Promise<HostVerificationPaymentState> {
  const fr = await getT();
  const user = await requireUser();

  if (!isKonnectEnabled()) return { error: fr.common.erreurInconnue };
  // Réservé aux particuliers — l'agence a son propre système de lots (§MI3).
  if (user.role !== "HOTE") return { error: fr.common.erreurInconnue };

  const order = await prisma.verificationCreditOrder.create({
    data: { ownerId: user.id, credits: 1, amount: HOST_VERIFICATION_PRICE_TND },
  });

  const [firstName, ...rest] = user.name.trim().split(/\s+/);

  let payUrl: string;
  let paymentRef: string;
  try {
    const result = await initKonnectPayment({
      amountTND: HOST_VERIFICATION_PRICE_TND,
      orderId: order.id,
      description: "Darna — vérification Wakil",
      // Même webhook générique que les lots agence (verification-credit-webhook) :
      // il règle un VerificationCreditOrder par son id, indifférent au rôle du
      // propriétaire.
      webhook: `${SITE_URL}/api/payments/konnect/verification-credit-webhook?vid=${order.id}&sig=${signKonnectWebhook(order.id)}`,
      successUrl: `${SITE_URL}/dashboard/annonces?konnect=success&vid=${order.id}`,
      failUrl: `${SITE_URL}/dashboard/annonces?konnect=fail&vid=${order.id}`,
      lifespanMinutes: 60,
      firstName: firstName || user.name,
      lastName: rest.join(" ") || undefined,
      email: user.email,
      phoneNumber: user.phone ?? undefined,
    });
    payUrl = result.payUrl;
    paymentRef = result.paymentRef;
  } catch (err) {
    logStructured("error", "konnect.host_verification_init_failed", {
      orderId: order.id,
      userId: user.id,
      error: (err as Error).message,
    });
    await logAudit({
      action: "VERIFICATION_CREDIT_PAYMENT_FAILED",
      userId: user.id,
      success: false,
      metadata: { orderId: order.id, stage: "init", payer: "HOTE" },
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
      credits: 1,
      amount: HOST_VERIFICATION_PRICE_TND,
      provider: "konnect",
      payer: "HOTE",
    },
  });

  return { payUrl };
}
