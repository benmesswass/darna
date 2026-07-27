import { prisma } from "@/lib/prisma";
import { logStructured } from "@/lib/audit";

/**
 * Complétion paresseuse du cycle de vie des réservations — même idiome que
 * `clearExpiredFeatured()` et l'expiration des EN_ATTENTE.
 *
 * Deux transitions, idempotentes (updateMany conditionnels) :
 *   1. CONFIRMEE dont le séjour est terminé (checkOut passé) → TERMINEE.
 *   2. TERMINEE encore EN_SEQUESTRE → séquestre LIBÉRÉ vers l'hôte (LIBERE).
 *      INERTE depuis le modèle commission-only (LANCEMENT_ROADMAP.md §L5.1,
 *      2026-07-27) : plus aucun code ne pose `EN_SEQUESTRE` (Darna n'encaisse
 *      plus le loyer), donc ce volet ne matche plus jamais rien pour une
 *      réservation créée après ce changement. Conservé tel quel (états du
 *      schéma non supprimés, cf. CLAUDE.md §Stack) — réactivable en V2 si
 *      l'escrow réel revient.
 *
 * À appeler avant d'afficher une liste de réservations.
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
