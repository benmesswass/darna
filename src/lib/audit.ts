import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "REGISTER"
  | "LOGOUT"
  | "BOOKING_CREATED"
  | "BOOKING_EXPIRED"
  | "PAYMENT_INITIATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_FAILED"
  | "BOOKING_CANCELLED"
  | "REVIEW_SUBMITTED"
  | "PROPERTY_CREATED"
  | "PROPERTY_UPDATED"
  | "PROPERTY_CLOSED"
  | "PROPERTY_REPUBLISHED"
  | "PROPERTY_FEATURED"
  | "PHOTO_ADDED"
  | "PHOTO_DELETED"
  | "AVAILABILITY_BLOCKED"
  | "AVAILABILITY_UNBLOCKED"
  | "KYC_OTP_REQUESTED"
  | "KYC_VERIFIED"
  | "PHONE_VERIFIED"
  | "CIN_VERIFIED"
  | "PROFILE_UPDATED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET"
  | "AVATAR_UPDATED"
  | "CONTACT_REQUEST"
  | "WAKIL_APPLY"
  | "WAKIL_STATUS_CHANGED"
  | "WAKIL_PROMOTED"
  | "FAVORITE_TOGGLE"
  | "PROPERTY_VERIFIED"
  | "PROPERTY_UNVERIFIED"
  | "EMAIL_OTP_REQUESTED"
  | "EMAIL_VERIFIED"
  // Anti-bypass messagerie : coordonnées masquées dans un message, et escalade
  // lorsqu'un même utilisateur répète les tentatives.
  | "MESSAGE_FLAGGED"
  | "MESSAGE_BYPASS_ESCALATION"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_REACTIVATED";

/**
 * Audit trail — chaque événement sensible est enregistré avec userId, IP et
 * métadonnées. Silencieux en cas d'échec d'écriture (ne doit jamais bloquer
 * le flux principal).
 */
export async function logAudit(params: {
  action: AuditAction;
  userId?: string;
  success?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const ip = await clientIp();
    await prisma.auditLog.create({
      data: {
        action: params.action,
        userId: params.userId ?? null,
        ip,
        metadata: JSON.stringify(params.metadata ?? {}),
        success: params.success ?? true,
      },
    });
  } catch (err) {
    // L'audit log ne doit jamais crasher le flux métier
    console.error("[AUDIT] write failed:", params.action, err);
  }
}

/**
 * Log console structuré JSON pour les systèmes de log externes (Logtail, Axiom…).
 * Toujours actif, même si la DB est indisponible.
 */
export function logStructured(
  level: "info" | "warn" | "error",
  event: string,
  ctx: Record<string, unknown> = {}
): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...ctx,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
