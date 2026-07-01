/**
 * Requêtes de la messagerie centralisée (« Mon espace › Messagerie »).
 *
 * Un fil est attaché à une réservation (cf. modèle Message) et n'a que DEUX
 * parties : le voyageur (`booking.guestId`) et l'hôte (`booking.property.ownerId`).
 * « Non lu pour moi » = message dont je ne suis PAS l'auteur et dont `readAt`
 * est null. Le compteur sert la pastille du menu, l'API de notification et la
 * page hub. Module SERVEUR uniquement.
 */

import { prisma } from "@/lib/prisma";

/** Filtre Prisma : réservations dont l'utilisateur est voyageur OU hôte. */
function participantWhere(userId: string) {
  return {
    OR: [{ guestId: userId }, { property: { ownerId: userId } }],
  };
}

/** Nombre total de messages non lus reçus par l'utilisateur (tous fils confondus). */
export function countUnreadMessages(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      booking: participantWhere(userId),
    },
  });
}

export type Conversation = {
  bookingId: string;
  propertyTitle: string;
  /** Nom de l'autre partie (hôte si je suis voyageur, voyageur si je suis hôte). */
  otherName: string;
  /** « guest » = je suis le voyageur ; « host » = je suis l'hôte. */
  viewer: "guest" | "host";
  lastBody: string;
  lastAt: Date;
  lastMine: boolean;
  unread: number;
};

/**
 * Liste des conversations de l'utilisateur, la plus récente d'abord. Une
 * conversation = une réservation où il participe ET qui contient au moins un
 * message. Le compteur de non-lus est calculé par fil en une seule requête
 * groupée (pas de N+1).
 */
export async function listConversations(userId: string): Promise<Conversation[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      ...participantWhere(userId),
      messages: { some: {} },
    },
    select: {
      id: true,
      guestId: true,
      property: {
        select: { title: true, ownerId: true, owner: { select: { name: true } } },
      },
      guest: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
    },
  });

  if (bookings.length === 0) return [];

  // Non-lus par fil en une requête groupée.
  const grouped = await prisma.message.groupBy({
    by: ["bookingId"],
    where: {
      bookingId: { in: bookings.map((b) => b.id) },
      readAt: null,
      senderId: { not: userId },
    },
    _count: { _all: true },
  });
  const unreadByBooking = new Map(grouped.map((g) => [g.bookingId, g._count._all]));

  return bookings
    .map((b): Conversation => {
      const last = b.messages[0];
      const viewer: "guest" | "host" = b.guestId === userId ? "guest" : "host";
      const otherName = viewer === "guest" ? b.property.owner.name : b.guest.name;
      return {
        bookingId: b.id,
        propertyTitle: b.property.title,
        otherName,
        viewer,
        lastBody: last.body,
        lastAt: last.createdAt,
        lastMine: last.senderId === userId,
        unread: unreadByBooking.get(b.id) ?? 0,
      };
    })
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

/**
 * Marque comme lus tous les messages d'un fil reçus par l'utilisateur (donc
 * envoyés par l'AUTRE partie). Idempotent. Renvoie le nombre de messages marqués.
 */
export async function markThreadRead(bookingId: string, userId: string): Promise<number> {
  const res = await prisma.message.updateMany({
    where: { bookingId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });
  return res.count;
}
