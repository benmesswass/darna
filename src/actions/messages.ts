"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";
import { scanForContactInfo } from "@/lib/message-scan";
import { logStructured } from "@/lib/audit";

export type MessageFormState = { error?: string; sent?: boolean } | undefined;

const schema = z.object({
  bookingId: z.string().cuid(),
  body: z.string().trim().min(1).max(2000),
});

/**
 * Envoi d'un message dans la messagerie interne d'une réservation.
 *
 * Autorisation STRICTE (jamais de confiance au client) : l'auteur doit être le
 * voyageur OU l'hôte de la réservation, et la réservation doit être confirmée
 * (CONFIRMEE/TERMINEE). Le corps est scanné côté serveur — numéros/e-mails
 * masqués avant stockage (anti-bypass).
 */
export async function sendMessageAction(
  _prev: MessageFormState,
  formData: FormData
): Promise<MessageFormState> {
  const fr = await getT();
  const user = await requireUser();

  if (!(await assertRateLimit("message"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = schema.safeParse({
    bookingId: formData.get("bookingId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: {
      id: true,
      status: true,
      guestId: true,
      property: { select: { ownerId: true } },
    },
  });

  // Participant de la réservation uniquement (voyageur ou hôte).
  if (
    !booking ||
    (booking.guestId !== user.id && booking.property.ownerId !== user.id)
  ) {
    return { error: fr.common.erreurInconnue };
  }
  // La messagerie ne s'ouvre qu'une fois la réservation ferme.
  if (booking.status !== "CONFIRMEE" && booking.status !== "TERMINEE") {
    return { error: fr.messages.indisponible };
  }

  // Masquage serveur des coordonnées avant stockage.
  const { clean, flagged } = scanForContactInfo(parsed.data.body);

  await prisma.message.create({
    data: { bookingId: booking.id, senderId: user.id, body: clean, flagged },
  });

  if (flagged) {
    logStructured("warn", "message.contact_masked", {
      bookingId: booking.id,
      userId: user.id,
    });
  }

  revalidatePath(`/reservation/${booking.id}/messages`);
  return { sent: true };
}
