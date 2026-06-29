"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";
import { scanForContactInfo } from "@/lib/message-scan";
import { contactRevealState } from "@/lib/contact-reveal";
import { logAudit, logStructured } from "@/lib/audit";
import {
  MESSAGE_FLAG_ESCALATION_THRESHOLD,
  MESSAGE_FLAG_SUSPENSION_THRESHOLD,
} from "@/lib/config";
import type { CancelPolicy } from "@/lib/constants";

export type MessageFormState =
  | {
      error?: string;
      sent?: boolean;
      warned?: boolean;
      escalated?: boolean;
      suspended?: boolean;
    }
  | undefined;

const schema = z.object({
  bookingId: z.string().cuid(),
  body: z.string().trim().min(1).max(2000),
});

/**
 * Envoi d'un message dans la messagerie interne d'une réservation.
 *
 * Autorisation STRICTE (jamais de confiance au client) : l'auteur doit être le
 * voyageur OU l'hôte de la réservation, et la réservation doit être confirmée.
 *
 * Masquage CONTEXTUEL : tant que la réservation n'est pas ferme (contact encore
 * verrouillé, cf. contactRevealState), les coordonnées sont masquées et la
 * tentative est signalée (nudge à l'auteur + audit + escalade). Une fois la
 * réservation ferme, les coordonnées peuvent être échangées librement (les deux
 * parties les ont déjà) → aucun masquage.
 */
export async function sendMessageAction(
  _prev: MessageFormState,
  formData: FormData
): Promise<MessageFormState> {
  const fr = await getT();
  const user = await requireUser();

  // Compte suspendu (anti-bypass) : plus aucun envoi possible.
  if (user.suspended) return { error: fr.messages.compteSuspendu };

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
      checkIn: true,
      guestId: true,
      property: { select: { ownerId: true, cancelPolicy: true } },
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

  // Réservation ferme (contact déjà débloqué) ? → échange libre, pas de masquage.
  const reveal = contactRevealState(
    booking.status,
    booking.checkIn,
    booking.property.cancelPolicy as CancelPolicy
  );

  let body = parsed.data.body;
  let flagged = false;
  if (reveal.state !== "revealed") {
    const scan = scanForContactInfo(parsed.data.body);
    body = scan.clean;
    flagged = scan.flagged;
  }

  await prisma.message.create({
    data: { bookingId: booking.id, senderId: user.id, body, flagged },
  });

  // Tentative de partage de coordonnées hors plateforme : on remonte à l'admin
  // (audit) et on escalade si l'utilisateur récidive.
  let escalated = false;
  let suspended = false;
  if (flagged) {
    logStructured("warn", "message.contact_masked", {
      bookingId: booking.id,
      userId: user.id,
    });
    await logAudit({
      action: "MESSAGE_FLAGGED",
      userId: user.id,
      success: true,
      metadata: { bookingId: booking.id },
    });

    const flaggedCount = await prisma.message.count({
      where: { senderId: user.id, flagged: true },
    });
    escalated = flaggedCount >= MESSAGE_FLAG_ESCALATION_THRESHOLD;
    if (escalated) {
      await logAudit({
        action: "MESSAGE_BYPASS_ESCALATION",
        userId: user.id,
        success: false,
        metadata: { bookingId: booking.id, flaggedCount },
      });
    }

    // Au-delà du seuil de suspension : le compte est RÉELLEMENT suspendu.
    if (flaggedCount >= MESSAGE_FLAG_SUSPENSION_THRESHOLD) {
      await prisma.user.update({
        where: { id: user.id },
        data: { suspended: true, suspendedAt: new Date() },
      });
      await logAudit({
        action: "ACCOUNT_SUSPENDED",
        userId: user.id,
        success: false,
        metadata: { bookingId: booking.id, flaggedCount },
      });
      suspended = true;
    }
  }

  revalidatePath(`/reservation/${booking.id}/messages`);
  return { sent: true, warned: flagged, escalated, suspended };
}
