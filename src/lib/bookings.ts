import { prisma } from "@/lib/prisma";
import { logStructured } from "@/lib/audit";

/**
 * Complétion paresseuse du cycle de vie des réservations — même idiome que
 * `clearExpiredFeatured()` et l'expiration des EN_ATTENTE.
 *
 * Deux transitions, idempotentes (updateMany conditionnels) :
 *   1. CONFIRMEE dont le séjour est terminé (checkOut passé) → TERMINEE.
 *   2. TERMINEE encore EN_SEQUESTRE → séquestre LIBÉRÉ vers l'hôte (LIBERE).
 *
 * À appeler avant d'afficher une liste de réservations. Le découplage en deux
 * updates rend la libération correcte même si une réservation était CONFIRMEE
 * sans séquestre (escrow AUCUN) : on ne libère que ce qui était sous séquestre.
 *
 * Module SERVEUR uniquement.
 */
export async function completeElapsedBookings(): Promise<void> {
  const now = new Date();

  await prisma.booking.updateMany({
    where: { status: "CONFIRMEE", checkOut: { lt: now } },
    data: { status: "TERMINEE" },
  });

  const { count } = await prisma.booking.updateMany({
    where: { status: "TERMINEE", escrow: "EN_SEQUESTRE" },
    data: { escrow: "LIBERE" },
  });

  if (count > 0) {
    logStructured("info", "escrow.released_batch", { count });
  }
}
