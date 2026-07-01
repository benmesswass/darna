import { SUSPENSION_DURATIONS_DAYS } from "@/lib/config";

const DAY_MS = 86_400_000;

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
