import type { CancelPolicy } from "@/lib/constants";

const DAY_MS = 86_400_000;

export interface RefundResult {
  refundAmount: number;
  refundRate: number; // 0 | 0.5 | 1
}

/**
 * Calcule le montant remboursable selon la politique et le délai restant.
 * FLEXIBLE : 100 % si ≥ 1 j avant check-in.
 * MODEREE  : 100 % si ≥ 7 j ; 0 % après.
 * STRICTE  : 50 % si ≥ 14 j ; 0 % après.
 */
export function computeRefund(
  totalPrice: number,
  checkIn: Date,
  policy: CancelPolicy,
  now = new Date()
): RefundResult {
  const daysUntil = (checkIn.getTime() - now.getTime()) / DAY_MS;

  let refundRate: 0 | 0.5 | 1;
  if (policy === "FLEXIBLE") {
    refundRate = daysUntil >= 1 ? 1 : 0;
  } else if (policy === "MODEREE") {
    refundRate = daysUntil >= 7 ? 1 : 0;
  } else {
    refundRate = daysUntil >= 14 ? 0.5 : 0;
  }

  return { refundRate, refundAmount: Math.round(totalPrice * refundRate) };
}
