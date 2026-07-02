import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureExpiringSoonNotifications } from "@/lib/notification-center";

// Sondé périodiquement par NotificationBell : jamais mis en cache.
export const dynamic = "force-dynamic";

const LIMIT = 20;

/**
 * Renvoie les notifications de l'utilisateur connecté : `{ count, items }`.
 * `count` = non-lues. Vide si non connecté (pas d'erreur — la sonde tourne
 * côté client tant que la session est ouverte, cf. /api/messages/unread-count).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { count: 0, items: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // Détection paresseuse des annonces bientôt expirées (pas de cron).
  await ensureExpiringSoonNotifications(user.id);

  const [count, items] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),
  ]);

  return NextResponse.json(
    {
      count,
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        propertyTitle: n.propertyTitle,
        href: n.href,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt ? n.readAt.toISOString() : null,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
