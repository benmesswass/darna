/**
 * Programme de crédits parrainage/bienvenue (CROISSANCE_ROADMAP.md §CR0) —
 * fondations uniquement : solde par utilisateur (CreditWallet, créé
 * paresseusement — même convention que VerificationWallet, cf.
 * verification-credits.ts) + ledger append-only (CreditTransaction).
 *
 * Ce module ne connaît AUCUNE règle métier (montants, plafonds, quand
 * créditer/débiter) — celles-ci vivent dans les actions de chaque chantier
 * qui consomme ces primitives (CR1 parcours voyageur/checkout, CR2
 * parrainage hôte, CR3 bienvenue générique). Idem pour l'idempotence de
 * l'émission (« un crédit par filleul, jamais deux ») : c'est au caller de
 * gater son propre appel à issueCredit (CR4).
 */

import { randomBytes } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CREDIT_CHECKOUT_CAP_RATE, CREDIT_VALIDITY_DAYS } from "@/lib/config";
import type { CreditTransactionMotif } from "@/lib/constants";

/** Client Prisma global OU transaction (ex. createBookingAction) — mêmes appels des deux côtés. */
type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Solde de crédits restant. L'ABSENCE de CreditWallet vaut solde 0 — la ligne
 * n'est matérialisée qu'au premier mouvement réel (cf. issueCredit/spendCredit),
 * même convention que verificationCreditsRemaining.
 */
export async function creditBalance(userId: string): Promise<number> {
  const wallet = await prisma.creditWallet.findUnique({
    where: { userId },
    select: { balance: true },
  });
  return wallet?.balance ?? 0;
}

export interface IssueCreditParams {
  userId: string;
  /** TND, toujours positif — le sens (émission) est implicite à cette fonction. */
  amount: number;
  motif: CreditTransactionMotif;
  bookingId?: string;
  referredUserId?: string;
}

/**
 * Émet un crédit : matérialise le wallet si besoin puis crédite le solde
 * (upsert, même pattern que settleVerificationCreditOrder), et journalise le
 * mouvement dans CreditTransaction avec `expiresAt` = maintenant +
 * CREDIT_VALIDITY_DAYS — posé UNIQUEMENT ici, jamais recalculé ailleurs.
 * N'est PAS idempotent en soi : un appel = un mouvement. Le caller gate ses
 * propres doublons (cf. doc du module).
 *
 * `db` : client Prisma global (défaut) OU transaction en cours — passer `tx`
 * quand l'émission doit être atomique avec une autre écriture de la même
 * transaction (même convention que claimRebookingDiscount(tx, …)).
 */
export async function issueCredit(params: IssueCreditParams, db: DbClient = prisma): Promise<void> {
  const { userId, amount, motif, bookingId, referredUserId } = params;
  if (amount <= 0) throw new Error("issueCredit: amount must be positive");

  const wallet = await db.creditWallet.upsert({
    where: { userId },
    create: { userId, balance: amount },
    update: { balance: { increment: amount } },
  });

  await db.creditTransaction.create({
    data: {
      walletId: wallet.id,
      amount,
      motif,
      expiresAt: new Date(Date.now() + CREDIT_VALIDITY_DAYS * 24 * 60 * 60 * 1000),
      bookingId,
      referredUserId,
    },
  });
}

export interface SpendCreditParams {
  userId: string;
  /** TND, toujours positif — le montant DÉPENSÉ (le mouvement journalisé sera négatif). */
  amount: number;
  motif: CreditTransactionMotif;
  bookingId?: string;
}

/**
 * Dépense `amount` du solde, ATOMIQUEMENT : jamais de lecture-puis-décrément
 * qui pourrait passer sous zéro en cas de requêtes concurrentes — même
 * principe que consumeVerificationCredit (`updateMany` gardé par
 * `balance: { gte }`). Retourne `false` sans AUCUNE mutation si le solde est
 * insuffisant. Ne connaît PAS les règles de plafond checkout (cf.
 * computeCreditApplication ci-dessous) : le caller applique le plafond avant
 * d'appeler cette primitive.
 *
 * `db` : client Prisma global (défaut) OU transaction en cours — passer `tx`
 * pour coupler atomiquement la dépense à la création de la réservation
 * (même convention que claimRebookingDiscount(tx, …)) : si la réservation
 * échoue/rollback, la dépense de crédit doit rollback avec elle.
 */
export async function spendCredit(params: SpendCreditParams, db: DbClient = prisma): Promise<boolean> {
  const { userId, amount, motif, bookingId } = params;
  if (amount <= 0) throw new Error("spendCredit: amount must be positive");

  // Matérialise d'abord la ligne à 0 si elle n'existe pas encore (no-op sinon),
  // pour que l'updateMany conditionné ci-dessous ait une ligne sur laquelle
  // s'appliquer dès le tout premier appel pour ce compte.
  await db.creditWallet.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {},
  });

  const result = await db.creditWallet.updateMany({
    where: { userId, balance: { gte: amount } },
    data: { balance: { decrement: amount } },
  });
  if (result.count === 0) return false;

  const wallet = await db.creditWallet.findUniqueOrThrow({
    where: { userId },
    select: { id: true },
  });
  await db.creditTransaction.create({
    data: { walletId: wallet.id, amount: -amount, motif, bookingId },
  });
  return true;
}

/**
 * Calcule le crédit RÉELLEMENT applicable à une réservation — pure, aucun
 * accès base (même patron que computeRebookingDiscount). Deux planchers non
 * négociables (préambule CROISSANCE_ROADMAP.md, cumulatifs avec toute autre
 * remise déjà appliquée sur `totalPrice`, ex. RebookingDiscount) :
 *  - jamais plus de CREDIT_CHECKOUT_CAP_RATE (30 %) du total ACTUEL (après
 *    toute autre remise déjà appliquée) ;
 *  - jamais au-delà de `totalPrice - subtotal` : la commission Darna peut
 *    être intégralement absorbée, mais le prix hôte (`subtotal`) ne bouge
 *    JAMAIS — ce reste-à-couvrir se réduit déjà mécaniquement si une autre
 *    remise (ex. AH4) a été appliquée avant.
 * Résultat toujours arrondi à l'entier TND (comme toutes les remises du projet).
 */
export function computeCreditApplication(params: {
  balance: number;
  totalPrice: number;
  subtotal: number;
}): number {
  const { balance, totalPrice, subtotal } = params;
  const commissionRoom = totalPrice - subtotal;
  const rateCap = Math.round(totalPrice * CREDIT_CHECKOUT_CAP_RATE);
  return Math.max(0, Math.min(balance, rateCap, commissionRoom));
}

/**
 * Code de parrainage court, lisible, partageable par lien (`?ref=CODE`) —
 * même convention que le suffixe anti-collision des slugs (randomBytes,
 * aucune boucle de retry : entropie suffisante, cf. buildPropertySlug /
 * src/actions/properties.ts). 4 octets hex majuscule ~4.3 milliards de
 * combinaisons.
 */
function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Code de parrainage de l'utilisateur, généré PARESSEUSEMENT au premier appel
 * (premier partage) — jamais régénéré une fois posé.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (user.referralCode) return user.referralCode;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { referralCode: generateReferralCode() },
    select: { referralCode: true },
  });
  return updated.referralCode as string;
}

/**
 * Résout un code de parrainage vers son propriétaire (le parrain), ou `null`
 * si invalide/inconnu. Lecture seule — poser `User.referredById` à
 * l'inscription (une seule fois, jamais modifiable) est la responsabilité du
 * flux d'inscription (CR1), pas de ce module.
 */
export async function findUserByReferralCode(code: string): Promise<{ id: string } | null> {
  return prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
}
