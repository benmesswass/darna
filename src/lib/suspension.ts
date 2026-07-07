import { SUSPENSION_DURATIONS_DAYS } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const DAY_MS = 86_400_000;

/**
 * Motif d'une suspension — stocké sur `User.suspensionReason` pour que le
 * bandeau « Pourquoi ? » (src/app/dashboard/layout.tsx) explique la VRAIE
 * raison plutôt qu'un texte générique. Un seul mécanisme de suspension pour
 * tout le projet (cf. applySuspension) mais plusieurs déclencheurs possibles.
 */
export const SUSPENSION_REASONS = [
  "MESSAGE_BYPASS",
  "BOOKING_NO_SHOW",
  "HOST_CANCELLED_BOOKING",
  // Décision manuelle admin (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP8) : facture
  // hôte impayée malgré relance — pas de palier automatique dédié, réutilise
  // la même échelle progressive que les autres motifs.
  "HOST_INVOICE_OVERDUE",
] as const;
export type SuspensionReason = (typeof SUSPENSION_REASONS)[number];

/** Vue minimale d'un compte pour évaluer sa suspension. */
export type SuspensionState = {
  suspended: boolean;
  suspendedUntil: Date | null;
};

/**
 * Une suspension est ACTIVE si le compte est marqué suspendu ET que la fin de
 * suspension est soit indéfinie (null), soit encore dans le futur. Une
 * suspension temporaire expirée n'est plus active (déblocage paresseux).
 */
export function isSuspended(user: SuspensionState, now: Date = new Date()): boolean {
  if (!user.suspended) return false;
  // suspendedUntil absent/null = suspension indéfinie (toujours active).
  return !user.suspendedUntil || user.suspendedUntil.getTime() > now.getTime();
}

/**
 * Calcule la prochaine suspension à appliquer pour la `nextCount`-ième fois
 * (1 = première). Renvoie la date de fin (`until`) ou `null` pour une
 * suspension indéfinie (palier dépassé → revue admin).
 */
export function nextSuspension(
  nextCount: number,
  now: Date = new Date()
): { until: Date | null } {
  const days = SUSPENSION_DURATIONS_DAYS[nextCount - 1];
  if (days === undefined) return { until: null }; // indéfinie
  return { until: new Date(now.getTime() + days * DAY_MS) };
}

/**
 * Durée (en jours) de la PROCHAINE suspension pour un utilisateur ayant déjà été
 * suspendu `currentCount` fois, ou `null` si la prochaine serait indéfinie (au
 * -delà du dernier palier). Sert à prévenir l'utilisateur de la sanction à venir.
 */
export function nextSuspensionDays(currentCount: number): number | null {
  return SUSPENSION_DURATIONS_DAYS[currentCount] ?? null;
}

/**
 * Applique la PROCHAINE suspension progressive à un compte et journalise
 * l'événement — mutation partagée entre l'anti-bypass messagerie
 * (src/actions/messages.ts) et le signalement de no-show Rail 2
 * (src/actions/bookings.ts, cf. PAIEMENT_SUR_PLACE_ROADMAP.md §PSP3). Un seul
 * mécanisme de suspension dans tout le projet, jamais dupliqué.
 */
export async function applySuspension(
  userId: string,
  reason: SuspensionReason,
  metadata: Record<string, unknown> = {}
): Promise<{ level: number; until: Date | null }> {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { suspensionCount: true },
  });
  const level = (current?.suspensionCount ?? 0) + 1;
  const { until } = nextSuspension(level);
  await prisma.user.update({
    where: { id: userId },
    data: {
      suspended: true,
      suspendedAt: new Date(),
      suspendedUntil: until,
      suspensionCount: level,
      suspensionReason: reason,
    },
  });
  await logAudit({
    action: "ACCOUNT_SUSPENDED",
    userId,
    success: false,
    metadata: { ...metadata, reason, level, until: until?.toISOString() ?? null },
  });
  return { level, until };
}
