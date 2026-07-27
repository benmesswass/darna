/**
 * Réduction ponctuelle (ANNULATION_HOTE_ROADMAP.md §AH4) : geste commercial
 * proposé au voyageur sur UNE suggestion de relogement après une annulation
 * hôte. Token signé (HMAC-SHA256, même patron que signKonnectWebhook dans
 * src/lib/konnect.ts — clé dédiée si fournie, sinon dérivée d'AUTH_SECRET
 * avec séparation de domaine), usage unique consommé atomiquement dans
 * createBookingAction. Pas "use server" : jamais un endpoint RPC client,
 * uniquement des fonctions serveur importées par des server actions.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  REBOOKING_DISCOUNT_CAP_TND,
  REBOOKING_DISCOUNT_RATE,
  REBOOKING_DISCOUNT_VALIDITY_DAYS,
} from "@/lib/config";

const DAY_MS = 86_400_000;

function discountKey(): string {
  const dedicated = process.env.REBOOKING_DISCOUNT_SECRET;
  if (dedicated) return dedicated;
  const auth = process.env.AUTH_SECRET ?? "darna-dev-rebooking-discount";
  // Séparation de domaine : jamais réutiliser AUTH_SECRET tel quel pour un
  // autre usage cryptographique (même précaution que webhookKey côté Konnect).
  return createHmac("sha256", auth).update("rebooking-discount").digest("hex");
}

/**
 * Signe un token de réduction pour LA réservation annulée par l'hôte et LE
 * voyageur concerné. Encode aussi l'expiration (payload signé, jamais
 * confiance au client) — au format `base64url(payload).signature`.
 */
export function signRebookingDiscount(cancelledBookingId: string, guestId: string): string {
  const expiresAt = Date.now() + REBOOKING_DISCOUNT_VALIDITY_DAYS * DAY_MS;
  const payload = `${cancelledBookingId}:${guestId}:${expiresAt}`;
  const sig = createHmac("sha256", discountKey()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

/** Résultat de la vérification de la SIGNATURE/expiration seules (pas encore l'état en base). */
type VerifiedToken = { cancelledBookingId: string; guestId: string };

function verifySignature(token: string): VerifiedToken | null {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = Buffer.from(createHmac("sha256", discountKey()).update(payload).digest("base64url"));
  const provided = Buffer.from(sig);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;

  const [cancelledBookingId, guestId, expiresAtStr] = payload.split(":");
  const expiresAt = Number(expiresAtStr);
  if (!cancelledBookingId || !guestId || !Number.isFinite(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;

  return { cancelledBookingId, guestId };
}

/**
 * Calcule le montant de réduction (TND, arrondi) pour un nouveau prix de
 * séjour — pure, aucun accès base. Plafonnée à REBOOKING_DISCOUNT_CAP_TND ET
 * (§L5.1) aux frais Darna de la NOUVELLE réservation : Darna ne peut offrir
 * que sa propre commission, jamais le loyer, qu'elle ne touche plus.
 */
export function computeRebookingDiscount(newSubtotal: number, newServiceFee: number): number {
  return Math.min(
    Math.round(newSubtotal * REBOOKING_DISCOUNT_RATE),
    REBOOKING_DISCOUNT_CAP_TND,
    newServiceFee
  );
}

/**
 * Vérifie qu'un token est valide POUR ce voyageur ET pas déjà consommé —
 * lecture seule, sert à afficher le bandeau de réduction avant soumission du
 * formulaire de réservation. La consommation réelle (atomique, anti-rejeu)
 * se fait dans createBookingAction via claimRebookingDiscount.
 */
export async function isRebookingDiscountValid(
  token: string,
  guestId: string
): Promise<boolean> {
  const verified = verifySignature(token);
  if (!verified || verified.guestId !== guestId) return false;

  const cancelled = await prisma.booking.findUnique({
    where: { id: verified.cancelledBookingId },
    select: { guestId: true, rebookingDiscountUsedFor: true },
  });
  return !!cancelled && cancelled.guestId === guestId && !cancelled.rebookingDiscountUsedFor;
}

/**
 * Consomme ATOMIQUEMENT un token de réduction — à appeler DANS la même
 * transaction Prisma que la création de la nouvelle réservation.
 * `updateMany` conditionné à `rebookingDiscountUsedFor: null` : usage unique
 * garanti même sous requêtes concurrentes (la 2e ne trouve plus la ligne
 * dans l'état attendu). Retourne l'id de la réservation annulée si la
 * réduction a bien été réclamée, sinon `null` (token invalide/déjà utilisé).
 */
export async function claimRebookingDiscount(
  tx: Prisma.TransactionClient,
  token: string,
  guestId: string
): Promise<string | null> {
  const verified = verifySignature(token);
  if (!verified || verified.guestId !== guestId) return null;

  const claimed = await tx.booking.updateMany({
    where: {
      id: verified.cancelledBookingId,
      guestId,
      rebookingDiscountUsedFor: null,
    },
    // Marqueur provisoire — écrasé par le vrai id de la nouvelle réservation
    // une fois celle-ci créée (chicken-and-egg : son id n'existe pas encore
    // à cet instant). Voir l'appelant, createBookingAction.
    data: { rebookingDiscountUsedFor: "PENDING" },
  });
  return claimed.count === 1 ? verified.cancelledBookingId : null;
}
