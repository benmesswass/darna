"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getAnonId, logProductEvent } from "@/lib/product-events";

/**
 * Sous-ensemble de PRODUCT_EVENT_NAMES autorisé depuis le client (§IN2) —
 * volontairement plus restreint que le catalogue complet : un événement
 * server-only (ex. BOOKING_STARTED) ne doit jamais pouvoir être « déclaré »
 * par un appel client sans que l'action serveur correspondante se soit
 * réellement produite.
 */
const CLIENT_EVENT_NAMES = ["SHARE_CLICKED", "MAP_INTERACTED"] as const;

const MAX_METADATA_BYTES = 2048;

const schema = z.object({
  event: z.enum(CLIENT_EVENT_NAMES),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Point d'entrée pour les événements produit purement client, sans action
 * serveur existante à brancher dessus (clic partage, interaction carte).
 * userId/anonId toujours résolus serveur, jamais transmis par l'appelant.
 * Best-effort : jamais awaité bloquant côté appelant, échec silencieux.
 */
export async function trackEvent(input: unknown): Promise<void> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return;

  const metadataJson = JSON.stringify(parsed.data.metadata ?? {});
  if (metadataJson.length > MAX_METADATA_BYTES) return;

  const [user, anonId] = await Promise.all([getSessionUser(), getAnonId()]);
  const key = anonId ?? (await clientIp());
  if (!(await rateLimit("track-event", key))) return;

  await logProductEvent({
    event: parsed.data.event,
    userId: user?.id ?? null,
    anonId,
    metadata: parsed.data.metadata,
  });
}
