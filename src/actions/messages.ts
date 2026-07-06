"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";
import { scanForContactInfo, CONTACT_MASK } from "@/lib/message-scan";
import { contactRevealState } from "@/lib/contact-reveal";
import { logAudit, logStructured } from "@/lib/audit";
import { sendNewMessageEmail } from "@/lib/notifications";
import {
  MESSAGE_FLAG_ESCALATION_THRESHOLD,
  MESSAGE_FLAG_SUSPENSION_THRESHOLD,
} from "@/lib/config";
import { isSuspended, applySuspension } from "@/lib/suspension";
import { formatDateFr } from "@/lib/format";
import type { CancelPolicy } from "@/lib/constants";

export type MessageFormState =
  | {
      error?: string;
      sent?: boolean;
      warned?: boolean;
      masked?: boolean;
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

  // Compte suspendu ACTIF (anti-bypass) : plus aucun envoi possible.
  if (isSuspended(user)) {
    return {
      error: user.suspendedUntil
        ? fr.messages.compteSuspenduJusqu(formatDateFr(user.suspendedUntil))
        : fr.messages.compteSuspendu,
    };
  }

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
  let masked = false;
  let flagged = false;
  if (reveal.state !== "revealed") {
    // Contexte anti-découpage : si l'expéditeur a déjà un message signalé récent
    // dans ce fil, on considère que le fil partage des coordonnées → on masque
    // même les suites courtes de chiffres du message courant (numéro éclaté).
    const recent = await prisma.message.findMany({
      where: { bookingId: booking.id, senderId: user.id, flagged: true },
      select: { id: true },
      take: 1,
    });
    const scan = scanForContactInfo(parsed.data.body, {
      contextSolicited: recent.length > 0,
    });
    body = scan.clean;
    masked = scan.masked;
    flagged = scan.flagged;
  }

  const created = await prisma.message.create({
    data: { bookingId: booking.id, senderId: user.id, body, flagged },
    select: { id: true },
  });

  // Notifie le destinataire par e-mail (non bloquant : avale ses propres erreurs).
  await sendNewMessageEmail(created.id);

  // Signalement admin : toute tentative (coordonnée masquée OU simple
  // sollicitation) est tracée pour monitoring.
  if (flagged) {
    logStructured("warn", "message.contact_flagged", {
      bookingId: booking.id,
      userId: user.id,
      masked,
    });
    await logAudit({
      action: "MESSAGE_FLAGGED",
      userId: user.id,
      success: true,
      metadata: { bookingId: booking.id, masked },
    });
  }

  // Escalade / suspension : SEUL un partage RÉEL de coordonnées (masked) compte —
  // une simple sollicitation (« appelle-moi ») est signalée mais ne suspend pas.
  let escalated = false;
  let suspended = false;
  if (masked) {
    const maskedCount = await prisma.message.count({
      where: { senderId: user.id, body: { contains: CONTACT_MASK } },
    });
    escalated = maskedCount >= MESSAGE_FLAG_ESCALATION_THRESHOLD;
    if (escalated) {
      await logAudit({
        action: "MESSAGE_BYPASS_ESCALATION",
        userId: user.id,
        success: false,
        metadata: { bookingId: booking.id, maskedCount },
      });
    }

    // Au-delà du seuil de suspension : suspension PROGRESSIVE (temporaire puis
    // de plus en plus longue, indéfinie au-delà du dernier palier).
    if (maskedCount >= MESSAGE_FLAG_SUSPENSION_THRESHOLD) {
      await applySuspension(user.id, "MESSAGE_BYPASS", { bookingId: booking.id, maskedCount });
      suspended = true;
    }
  }

  revalidatePath(`/reservation/${booking.id}/messages`);
  return { sent: true, warned: flagged, masked, escalated, suspended };
}
