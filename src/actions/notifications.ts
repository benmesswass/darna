"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const idSchema = z.string().cuid();

/** Marque une notification comme lue — uniquement la sienne. */
export async function markNotificationReadAction(id: string): Promise<void> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return;
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { id: parsed.data, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}

/** Marque toutes les notifications de l'utilisateur connecté comme lues. */
export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}
