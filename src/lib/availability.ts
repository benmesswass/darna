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
