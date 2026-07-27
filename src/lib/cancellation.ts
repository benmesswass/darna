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
 * Paliers de remboursement de chaque politique, exprimés en « jours AVANT le
 * check-in ». Source unique alignée sur computeRefund : annuler au moins
 * `daysBefore` jours avant l'arrivée donne `rate`. Sert à afficher la politique
 * avec des DATES précises (cf. cancellationSchedule), comme les concurrents.
 */
const POLICY_TIERS: Record<CancelPolicy, { rate: 1 | 0.5; daysBefore: number }[]> = {
  FLEXIBLE: [{ rate: 1, daysBefore: 1 }],
  MODEREE: [{ rate: 1, daysBefore: 5 }],
  FERME: [
    { rate: 1, daysBefore: 30 },
    { rate: 0.5, daysBefore: 7 },
  ],
  STRICTE: [{ rate: 0.5, daysBefore: 14 }],
};

/** Un palier daté : annuler avant `until` (inclus) donne `rate`. */
export type RefundTier = { rate: 1 | 0.5; until: Date };

/**
 * Calendrier de remboursement DATÉ pour une réservation : convertit les paliers
 * de la politique en dates limites concrètes à partir du `checkIn`. Au-delà du
 * dernier palier (date la plus tardive), le remboursement est nul. La grâce
 * 24 h n'y figure pas (elle dépend de la date de réservation, pas du check-in).
 */
export function cancellationSchedule(policy: CancelPolicy, checkIn: Date): RefundTier[] {
  return POLICY_TIERS[policy].map((t) => ({
    rate: t.rate,
    until: new Date(checkIn.getTime() - t.daysBefore * DAY_MS),
  }));
}

/**
 * Date de fin de la période d'ANNULATION GRATUITE (taux 100 %) d'une
 * réservation, ou `null` si la politique n'offre aucun palier gratuit (ex.
 * STRICTE). Avant cette date, annuler rembourse intégralement ; après, ça coûte.
 * Sert de seuil à la révélation différée du contact (anti-bypass) : tant
 * qu'annuler est gratuit, aucune coordonnée directe n'est échangée.
 */
export function freeCancellationCutoff(
  policy: CancelPolicy,
  checkIn: Date
): Date | null {
  const free = POLICY_TIERS[policy].find((t) => t.rate === 1);
  return free ? new Date(checkIn.getTime() - free.daysBefore * DAY_MS) : null;
}

/**
 * Calcule le montant remboursable selon la politique et le délai restant.
 *
 * ⚠️ `refundableBase` (LANCEMENT_ROADMAP.md §L5.2) = le montant EFFECTIVEMENT
 * réglé en ligne pour cette réservation (`booking.amountPaid`) — jamais le
 * loyer, que Darna ne touche plus depuis le modèle commission-only (§L5.1) :
 * il n'y a donc plus rien d'autre à rembourser que les frais Darna réellement
 * encaissés. En Rail 2 (SUR_PLACE), `amountPaid` vaut 0 → rien n'est jamais
 * remboursable ici (cohérent : aucun paiement en ligne n'a eu lieu). Les
 * fenêtres/paliers ci-dessous sont INCHANGÉS depuis avant §L5.1 — seule
 * l'assiette a changé (décision produit du 2026-07-27).
 *
 * Grâce 24 h (standard du marché) : annulation dans les 24 h suivant la
 * réservation = 100 % de la base remboursé quelle que soit la politique, À
 * CONDITION d'être encore à ≥ 7 jours du check-in.
 *
 * Politiques (calquées Airbnb courts séjours) :
 *  FLEXIBLE : 100 % si ≥ 1 j avant l'arrivée.
 *  MODEREE  : 100 % si ≥ 5 j avant.
 *  FERME    : 100 % si ≥ 30 j ; 50 % entre 7 et 30 j ; 0 % si < 7 j.
 *  STRICTE  : 50 % si ≥ 14 j ; 0 % après.
 */
export function computeRefund(
  refundableBase: number,
  checkIn: Date,
  policy: CancelPolicy,
  bookingCreatedAt: Date,
  now = new Date()
): RefundResult {
  const daysUntil = (checkIn.getTime() - now.getTime()) / DAY_MS;

  // Période de grâce : prioritaire sur la politique.
  const withinGrace = now.getTime() - bookingCreatedAt.getTime() <= GRACE_MS;
  if (withinGrace && daysUntil >= GRACE_MIN_DAYS_BEFORE) {
    return { refundRate: 1, refundAmount: refundableBase, grace: true };
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

  return {
    refundRate,
    refundAmount: Math.round(refundableBase * refundRate),
    grace: false,
  };
}
