/**
 * Gating du contact derrière l'acompte (anti-bypass Darna).
 *
 * Point d'autorisation UNIQUE pour révéler les coordonnées hôte ↔ voyageur :
 * aucune route ni server action ne doit exposer ces coordonnées sans passer par
 * `getRevealedContacts`. Les coordonnées ne sont révélées QUE si :
 *   1. la réservation est CONFIRMEE ou TERMINEE (l'acompte a été réglé), ET
 *   2. le `viewer` est soit le voyageur, soit l'hôte de CETTE réservation.
 *
 * Module SERVEUR uniquement (lit prisma + données personnelles).
 */

import { prisma } from "@/lib/prisma";

/** Coordonnées révélées d'une partie (jamais exposées avant confirmation). */
export type RevealedContact = {
  name: string;
  email: string;
  phone: string | null;
};

export type RevealedContacts = {
  /** Rôle du viewer dans la réservation. */
  viewer: "guest" | "host";
  /**
   * Coordonnées de l'AUTRE partie : l'hôte si le viewer est le voyageur, le
   * voyageur si le viewer est l'hôte. C'est tout ce que le viewer a le droit
   * de voir une fois la réservation confirmée.
   */
  counterpart: RevealedContact;
};

/**
 * Renvoie les coordonnées révélées pour une réservation, ou `null` si le viewer
 * n'y a pas droit (réservation non confirmée, ou viewer étranger à la
 * réservation). Toujours réévalué côté serveur — jamais de confiance au client.
 */
export async function getRevealedContacts(
  bookingId: string,
  viewerUserId: string
): Promise<RevealedContacts | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      guestId: true,
      guest: { select: { name: true, email: true, phone: true } },
      property: {
        select: {
          ownerId: true,
          owner: { select: { name: true, email: true, phone: true } },
        },
      },
    },
  });

  if (!booking) return null;

  // Gating : coordonnées révélées UNIQUEMENT après règlement de l'acompte.
  if (booking.status !== "CONFIRMEE" && booking.status !== "TERMINEE") {
    return null;
  }

  // Autorisation : le viewer doit être une partie de la réservation.
  if (viewerUserId === booking.guestId) {
    return { viewer: "guest", counterpart: booking.property.owner };
  }
  if (viewerUserId === booking.property.ownerId) {
    return { viewer: "host", counterpart: booking.guest };
  }
  return null;
}
