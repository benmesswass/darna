const DAY = 24 * 60 * 60 * 1000;

/**
 * Étale des plages réservées/bloquées en nuits civiles (YYYY-MM-DD), bornées à
 * [aujourd'hui, horizon]. Les dates en base sont stockées à minuit UTC : on
 * itère en UTC pour rester exact quel que soit le fuseau du serveur. Bornes
 * demi-ouvertes [start, end) — `end` est exclusif (= jour de départ libre),
 * cohérent avec la sémantique des réservations.
 *
 * Partagé par la page de réservation (calendrier voyageur) et le dashboard
 * (calendrier de blocage hôte).
 */
export function expandUnavailable(
  ranges: { start: Date; end: Date }[],
  horizonDays = 365
): string[] {
  const out = new Set<string>();
  const startOfTodayUtc = Date.parse(
    `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`
  );
  const horizon = startOfTodayUtc + horizonDays * DAY;
  for (const { start, end } of ranges) {
    let t = Math.max(start.getTime(), startOfTodayUtc);
    const endT = end.getTime();
    while (t < endT && t <= horizon) {
      out.add(new Date(t).toISOString().slice(0, 10));
      t += DAY;
    }
  }
  return [...out];
}

/**
 * Comme {@link expandUnavailable}, mais ne retient que les plages portant une
 * note (motif de blocage) et renvoie une carte jour civil (YYYY-MM-DD) → note.
 * Sert au calendrier de blocage de l'hôte : afficher le motif au survol d'un
 * jour bloqué. Strictement privé à l'hôte — jamais transmis au voyageur.
 */
export function expandNotes(
  ranges: { start: Date; end: Date; reason: string | null }[],
  horizonDays = 365
): Record<string, string> {
  const out: Record<string, string> = {};
  const startOfTodayUtc = Date.parse(
    `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`
  );
  const horizon = startOfTodayUtc + horizonDays * DAY;
  for (const { start, end, reason } of ranges) {
    if (!reason) continue;
    let t = Math.max(start.getTime(), startOfTodayUtc);
    const endT = end.getTime();
    while (t < endT && t <= horizon) {
      out[new Date(t).toISOString().slice(0, 10)] = reason;
      t += DAY;
    }
  }
  return out;
}
