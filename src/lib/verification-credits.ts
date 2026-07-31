/**
 * Crédits de vérification Wakil (MONETISATION_IMMO_ROADMAP.md §MI3) : lecture
 * + consommation du solde. Régime DIFFÉRENT selon le rôle (décision Wassim du
 * 2026-07-20) :
 *  - AGENCE : FREE_VERIFICATION_CREDITS gratuits À VIE (+ bonus Starter
 *    ponctuel), puis achat d'un LOT prépayé (VERIFICATION_CREDIT_PACKS) —
 *    jamais de paiement à l'unité.
 *  - HOTE : AUCUNE gratuite, paiement À L'UNITÉ obligatoire AVANT chaque
 *    vérification (HOST_VERIFICATION_PRICE_TND, src/actions/
 *    host-verification-payments.ts) — jamais de lot.
 * Les DEUX régimes partagent le même solde (VerificationWallet, une ligne par
 * utilisateur) : seule la façon de l'alimenter diffère selon le rôle.
 * Écriture liée à un ACHAT vit dans src/actions/verification-credits.ts +
 * src/actions/host-verification-payments.ts + verification-credit-payments.ts.
 */

import { prisma } from "@/lib/prisma";
import { VERIFICATION_CREDIT_PACKS, type VerificationCreditPackKey } from "@/lib/constants";
import { FREE_VERIFICATION_CREDITS } from "@/lib/config";
import { growthMonetizationEnabled } from "@/lib/modes";

export function verificationCreditPack(key: string) {
  return VERIFICATION_CREDIT_PACKS.find((p) => p.key === key);
}

export function isVerificationCreditPackKey(key: string): key is VerificationCreditPackKey {
  return VERIFICATION_CREDIT_PACKS.some((p) => p.key === key);
}

/**
 * Solde gratuit initial (avant toute consommation/tout achat) selon le rôle.
 * Seul un compte AGENCE a un solde gratuit à vie — un HOTE part de 0 et doit
 * payer HOST_VERIFICATION_PRICE_TND avant sa toute première vérification.
 */
export function freeVerificationCreditsFor(role: string): number {
  return role === "AGENCE" ? FREE_VERIFICATION_CREDITS : 0;
}

/**
 * Solde de crédits de vérification restant. L'ABSENCE de VerificationWallet
 * vaut solde initial `freeVerificationCreditsFor(role)` (jamais consommé) —
 * même convention que Subscription absente = palier gratuit (MI1/MI2) : la
 * ligne n'est matérialisée qu'au premier usage réel (consommation ou achat).
 */
export async function verificationCreditsRemaining(userId: string, role: string): Promise<number> {
  const wallet = await prisma.verificationWallet.findUnique({
    where: { userId },
    select: { balance: true },
  });
  return wallet?.balance ?? freeVerificationCreditsFor(role);
}

/**
 * Consomme UN crédit de vérification, atomiquement. Retourne `true` si un
 * crédit a bien été prélevé (la vérification peut avoir lieu), `false` si le
 * solde est à 0 (aucune mutation — pour un HOTE qui n'a jamais payé, c'est le
 * cas dès le premier appel : `freeVerificationCreditsFor("HOTE") === 0`).
 *
 * Matérialise d'abord la ligne au solde gratuit initial si elle n'existe pas
 * encore (`upsert` — no-op si elle existe déjà), pour que le `updateMany`
 * conditionné ci-dessous ait une ligne sur laquelle s'appliquer dès le tout
 * premier appel pour ce compte. Le prélèvement lui-même passe par un
 * `updateMany` gardé par `balance: { gt: 0 }` — jamais de lecture-puis-
 * décrément qui pourrait faire passer le solde sous zéro en cas de requêtes
 * concurrentes (même principe que settleFeaturedOrder/settleSubscriptionPayment).
 *
 * P6.2 : tant que `growthMonetizationEnabled()` est faux, une AGENCE ne
 * consomme jamais de crédit (retour `true` immédiat, aucune écriture) — les
 * lots sont masqués (cf. dashboard/abonnement), donc appliquer l'épuisement
 * laisserait une agence bloquée sans aucune page pour en acheter. Un HOTE
 * n'est PAS concerné (régime différent et délibéré, jamais gratuit — cf.
 * src/lib/modes.ts) : cette branche ne touche que le rôle AGENCE.
 */
export async function consumeVerificationCredit(userId: string, role: string): Promise<boolean> {
  if (role === "AGENCE" && !growthMonetizationEnabled()) return true;

  await prisma.verificationWallet.upsert({
    where: { userId },
    create: { userId, balance: freeVerificationCreditsFor(role) },
    update: {},
  });

  const result = await prisma.verificationWallet.updateMany({
    where: { userId, balance: { gt: 0 } },
    data: { balance: { decrement: 1 } },
  });
  return result.count > 0;
}
