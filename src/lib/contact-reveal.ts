/**
 * Gating du contact derrière l'acompte ET la fin de la fenêtre d'annulation
 * gratuite (anti-bypass Darna, façon « walled garden » adapté au cash).
 *
 * Tant qu'annuler reste 100 % gratuit, aucune coordonnée directe n'est échangée :
 * sinon un voyageur (ou un hôte) pourrait réserver, récupérer le contact, puis
 * annuler sans frais pour traiter hors plateforme. Les coordonnées ne sont donc
 * révélées que lorsque :
 *   1. la réservation est CONFIRMEE/TERMINEE (acompte réglé), ET
 *   2. la période d'annulation gratuite est passée (annuler coûte désormais),
 *      ou la politique n'offre aucune annulation gratuite (rien à contourner), ET
 *   3. le `viewer` est soit le voyageur, soit l'hôte de CETTE réservation.
 *
 * Avant l'étape 2, le contact est « verrouillé » (date de déblocage connue).
 * Module SERVEUR uniquement (lit prisma + données personnelles).
 */

import { prisma } from "@/lib/prisma";
import { freeCancellationCutoff } from "@/lib/cancellation";
import type { CancelPolicy } from "@/lib/constants";

/** Coordonnées révélées d'une partie (jamais exposées avant déblocage). */
export type RevealedContact = {
  name: string;
  email: string;
  phone: string | null;
};

export type RevealedContacts = {
  /** Rôle du viewer dans la réservation. */
  viewer: "guest" | "host";
  /** Coordonnées de l'AUTRE partie (hôte si viewer = voyageur, et inversement). */
  counterpart: RevealedContact;
};

/**
 * Résultat du gating contact :
 *  • `revealed` : coordonnées disponibles (avec celles de l'autre partie) ;
 *  • `locked`   : réservation confirmée mais fenêtre gratuite encore ouverte —
 *                 on connaît la date de déblocage (`revealAt`) ;
 *  • `null`     : le viewer n'a pas le droit (non confirmée, ou viewer étranger).
 */
export type ContactGate =
  | ({ state: "revealed" } & RevealedContacts)
  | { state: "locked"; viewer: "guest" | "host"; revealAt: Date }
  | null;

/** État de révélation possible, indépendamment du viewer (logique pure). */
export type RevealState =
  | { state: "revealed" }
  | { state: "locked"; revealAt: Date }
  | { state: "hidden" };

/**
 * Décide PUREMENT (sans accès base) si le contact d'une réservation est révélé,
 * verrouillé (avec date) ou caché. Réutilisable dans les listes (dashboard)
 * pour éviter un appel base par ligne, et source de vérité du gating serveur.
 */
export function contactRevealState(
  status: string,
  checkIn: Date,
  policy: CancelPolicy,
  now: Date = new Date()
): RevealState {
  // Pas (encore) payé → rien à révéler.
  if (status !== "CONFIRMEE" && status !== "TERMINEE") return { state: "hidden" };

  const cutoff = freeCancellationCutoff(policy, checkIn);
  // Aucune annulation gratuite possible (ex. STRICTE) → rien à contourner :
  // on révèle dès la confirmation.
  if (!cutoff) return { state: "revealed" };
  // Fenêtre gratuite passée → annuler coûte désormais → on révèle.
  if (now.getTime() >= cutoff.getTime()) return { state: "revealed" };
  // Encore dans la fenêtre gratuite → verrouillé, déblocage à la date de cutoff.
  return { state: "locked", revealAt: cutoff };
}

/**
 * Renvoie l'état du contact pour une réservation et un viewer donné. `null` si
 * le viewer n'est pas une partie de la réservation, ou si elle n'est pas
 * confirmée. Sinon `revealed` (avec les coordonnées de l'autre partie) ou
 * `locked` (avec la date de déblocage). Toujours réévalué côté serveur.
 */
export async function getRevealedContacts(
  bookingId: string,
  viewerUserId: string,
  now: Date = new Date()
): Promise<ContactGate> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      guestId: true,
      checkIn: true,
      guest: { select: { name: true, email: true, phone: true } },
      property: {
        select: {
          ownerId: true,
          cancelPolicy: true,
          owner: { select: { name: true, email: true, phone: true } },
        },
      },
    },
  });

  if (!booking) return null;

  // Autorisation : le viewer doit être une partie de la réservation.
  const viewer: "guest" | "host" | null =
    viewerUserId === booking.guestId
      ? "guest"
      : viewerUserId === booking.property.ownerId
        ? "host"
        : null;
  if (!viewer) return null;

  const reveal = contactRevealState(
    booking.status,
    booking.checkIn,
    booking.property.cancelPolicy as CancelPolicy,
    now
  );

  if (reveal.state === "hidden") return null;
  if (reveal.state === "locked") {
    return { state: "locked", viewer, revealAt: reveal.revealAt };
  }
  const counterpart = viewer === "guest" ? booking.property.owner : booking.guest;
  return { state: "revealed", viewer, counterpart };
}
