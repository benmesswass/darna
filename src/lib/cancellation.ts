import type { CancelPolicy } from "@/lib/constants";

const DAY_MS = 86_400_000;
const GRACE_MS = 24 * 60 * 60 * 1000; // 24 h après la réservation
const GRACE_MIN_DAYS_BEFORE = 7; // grâce active seulement si check-in ≥ 7 j

export interface RefundResult {
  refundAmount: number;
  refundRate: number; // 0 | 0.5 | 1
  grace: boolean; // remboursé au titre de la grâce 24 h
}

/**
 * Calcule le montant remboursable selon la politique et le délai restant.
 *
 * Grâce 24 h (standard du marché) : annulation dans les 24 h suivant la
 * réservation = 100 % remboursé quelle que soit la politique, À CONDITION
 * d'être encore à ≥ 7 jours du check-in.
 *
 * Politiques (calquées Airbnb courts séjours) :
 *  FLEXIBLE : 100 % si ≥ 1 j avant l'arrivée.
 *  MODEREE  : 100 % si ≥ 5 j avant.
 *  FERME    : 100 % si ≥ 30 j ; 50 % entre 7 et 30 j ; 0 % si < 7 j.
 *  STRICTE  : 50 % si ≥ 14 j ; 0 % après.
 */
export function computeRefund(
  totalPrice: number,
  checkIn: Date,
  policy: CancelPolicy,
  bookingCreatedAt: Date,
  now = new Date()
): RefundResult {
  const daysUntil = (checkIn.getTime() - now.getTime()) / DAY_MS;

  // Période de grâce : prioritaire sur la politique.
  const withinGrace = now.getTime() - bookingCreatedAt.getTime() <= GRACE_MS;
  if (withinGrace && daysUntil >= GRACE_MIN_DAYS_BEFORE) {
    return { refundRate: 1, refundAmount: totalPrice, grace: true };
  }

  let refundRate: 0 | 0.5 | 1;
  if (policy === "FLEXIBLE") {
    refundRate = daysUntil >= 1 ? 1 : 0;
  } else if (policy === "MODEREE") {
    refundRate = daysUntil >= 5 ? 1 : 0;
  } else if (policy === "FERME") {
    refundRate = daysUntil >= 30 ? 1 : daysUntil >= 7 ? 0.5 : 0;
  } else {
    refundRate = daysUntil >= 14 ? 0.5 : 0;
  }

  return { refundRate, refundAmount: Math.round(totalPrice * refundRate), grace: false };
}
