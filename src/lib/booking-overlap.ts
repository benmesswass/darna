/**
 * Filtre Prisma des réservations qui bloquent RÉELLEMENT un créneau : les
 * réservations confirmées + les holds EN_ATTENTE encore vivants + les
 * demandes Rail 2 EN_ATTENTE_ACCEPTATION encore vivantes (même logique : tant
 * que l'hôte n'a pas refusé/laissé expirer, ces dates ne sont pas libres pour
 * un autre voyageur). Les holds/demandes expirés (créés lors d'une tentative
 * abandonnée, pas encore balayés en ANNULEE) NE bloquent PAS : sinon un panier
 * expiré rendrait les dates « indisponibles » alors que le calendrier les
 * propose librement (la page reserver filtre déjà `expiresAt > now`).
 *
 * Module partagé (pas dans src/actions/bookings.ts, qui est un fichier
 * "use server" — Next.js exige que CHAQUE export d'un tel fichier soit une
 * server action asynchrone, incompatible avec cette fonction synchrone pure).
 * Réutilisée par createBookingAction (conflit à la création) et
 * getRebookingSuggestions (src/lib/listings.ts, disponibilité des annonces
 * suggérées après une annulation hôte).
 */
export function blockingBookingOverlap(checkIn: Date, checkOut: Date) {
  return {
    checkIn: { lt: checkOut },
    checkOut: { gt: checkIn },
    OR: [
      { status: "CONFIRMEE" },
      { status: "EN_ATTENTE", expiresAt: { gt: new Date() } },
      { status: "EN_ATTENTE_ACCEPTATION", expiresAt: { gt: new Date() } },
    ],
  };
}
