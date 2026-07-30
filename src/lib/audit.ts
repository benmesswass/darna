import { createHash } from "node:crypto";
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
  | "GUEST_REVIEW_SUBMITTED"
  | "PROPERTY_CREATED"
  | "PROPERTY_UPDATED"
  | "PROPERTY_CLOSED"
  | "PROPERTY_REPUBLISHED"
  | "PROPERTY_FEATURED"
  | "PROPERTY_PROMO_SET"
  | "PROPERTY_PROMO_CLEARED"
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
  | "ACCOUNT_REACTIVATED"
  // Rail 2 (paiement sur place, PAIEMENT_SUR_PLACE_ROADMAP.md §PSP3).
  | "CASH_BOOKING_ACCEPTED"
  | "CASH_BOOKING_DECLINED"
  | "HOST_INVOICE_GENERATED"
  | "BOOKING_NO_SHOW_REPORTED"
  // Annulation hôte (ANNULATION_HOTE_ROADMAP.md §AH1).
  | "HOST_CANCELLED_BOOKING"
  // Règlement de la facture hôte (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP4).
  | "HOST_INVOICE_PAYMENT_INITIATED"
  | "HOST_INVOICE_PAYMENT_FAILED"
  | "HOST_INVOICE_PAID"
  // Dashboard admin factures (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP8).
  | "HOST_INVOICE_REMINDER_SENT"
  | "HOST_INVOICE_MANUAL_SUSPENSION"
  // Paiement réel du boost « à la une » (MONETISATION_IMMO_ROADMAP.md §MI0).
  | "PROPERTY_FEATURED_PAYMENT_INITIATED"
  | "PROPERTY_FEATURED_PAYMENT_FAILED"
  // Abonnement agence (MONETISATION_IMMO_ROADMAP.md §MI2).
  | "AGENCY_SUBSCRIPTION_PAYMENT_INITIATED"
  | "AGENCY_SUBSCRIPTION_PAYMENT_FAILED"
  | "AGENCY_SUBSCRIPTION_PAID"
  // Crédits de vérification Wakil (MONETISATION_IMMO_ROADMAP.md §MI3).
  | "VERIFICATION_CREDIT_PAYMENT_INITIATED"
  | "VERIFICATION_CREDIT_PAYMENT_FAILED"
  | "VERIFICATION_CREDIT_PURCHASED"
  // Programme de crédits parrainage/bienvenue (CROISSANCE_ROADMAP.md §CR1).
  | "REFERRAL_SIGNUP_CREDIT_ISSUED"
  | "CREDIT_APPLIED_AT_CHECKOUT"
  // Socle scheduler (LANCEMENT_ROADMAP.md §L3.1) — un tick = une entrée,
  // metadata { results } résume le statut de chaque job exécuté.
  | "JOB_TICK"
  // Remboursement des frais après annulation (LANCEMENT_ROADMAP.md §L5.2).
  | "REFUND_MARKED"
  // Garantie non-conformité (LANCEMENT_ROADMAP.md §L5.3).
  | "NON_CONFORMITY_REPORTED"
  | "NON_CONFORMITY_VALIDATED"
  | "NON_CONFORMITY_REJECTED"
  // Garantie no-show hôte (LANCEMENT_ROADMAP.md §L5.4).
  | "NO_SHOW_INDEMNITY_CLAIMED"
  | "ACCOUNT_DATA_EXPORTED"
  | "ACCOUNT_DELETED";

/**
 * Actions financières/identité (ROADMAP.md §P3.5) : seules celles-ci sont
 * chaînées par hachage (preuve en cas de litige) — le reste de l'audit log
 * garde son comportement actuel, sans surcoût. Périmètre volontairement
 * resserré au sens strict : événements de VÉRIFICATION d'identité (pas les
 * simples demandes d'OTP) et événements où de l'argent change réellement de
 * statut (pas la simple création/modification d'une annonce). Ajustable —
 * documenté dans docs/SECURITE_DONNEES.md §4.
 *
 * ⚠️ DUPLIQUÉ intentionnellement dans scripts/backfill-audit-chain.ts et
 * scripts/verify-audit-chain.ts (scripts Node autonomes, hors process
 * Next.js — même raison que la duplication crypto dans
 * scripts/rotate-kyc-key.ts). Toute modification ICI doit être répercutée
 * dans les deux scripts, sinon le backfill/la vérification dérive du
 * comportement réel de logAudit().
 */
const CHAINED_ACTIONS = new Set<AuditAction>([
  // Financier.
  "PAYMENT_INITIATED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_FAILED",
  "BOOKING_CREATED",
  "BOOKING_CANCELLED",
  "CASH_BOOKING_ACCEPTED",
  "CASH_BOOKING_DECLINED",
  "HOST_INVOICE_GENERATED",
  "HOST_INVOICE_PAYMENT_INITIATED",
  "HOST_INVOICE_PAYMENT_FAILED",
  "HOST_INVOICE_PAID",
  "HOST_INVOICE_MANUAL_SUSPENSION",
  "HOST_CANCELLED_BOOKING",
  "PROPERTY_FEATURED_PAYMENT_INITIATED",
  "PROPERTY_FEATURED_PAYMENT_FAILED",
  "AGENCY_SUBSCRIPTION_PAYMENT_INITIATED",
  "AGENCY_SUBSCRIPTION_PAYMENT_FAILED",
  "AGENCY_SUBSCRIPTION_PAID",
  "VERIFICATION_CREDIT_PAYMENT_INITIATED",
  "VERIFICATION_CREDIT_PAYMENT_FAILED",
  "VERIFICATION_CREDIT_PURCHASED",
  "REFERRAL_SIGNUP_CREDIT_ISSUED",
  "CREDIT_APPLIED_AT_CHECKOUT",
  "REFUND_MARKED",
  "NON_CONFORMITY_VALIDATED",
  "NON_CONFORMITY_REJECTED",
  "NO_SHOW_INDEMNITY_CLAIMED",
  // Identité.
  "KYC_VERIFIED",
  "CIN_VERIFIED",
  "PHONE_VERIFIED",
  "EMAIL_VERIFIED",
  "PROPERTY_VERIFIED",
  "PROPERTY_UNVERIFIED",
  "WAKIL_PROMOTED",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_REACTIVATED",
  "ACCOUNT_DELETED",
]);

const CHAIN_ID = "singleton";
const CHAIN_GENESIS = "genesis";
const CHAIN_MAX_ATTEMPTS = 8;

/**
 * Jitter aléatoire entre deux tentatives de CAS (§P3.5) — vérifié par un test
 * de charge réel (25 écritures vraiment concurrentes, Promise.all contre
 * Postgres) : SANS jitter, les perdants d'un round retentent tous en
 * lockstep (même timing de réveil), un effet troupeau qui peut faire
 * échouer certains writers même après 20 tentatives. Avec jitter, les
 * retries se désynchronisent et la contention se résout en quelques rounds.
 */
function chainRetryDelayMs(attempt: number): number {
  return Math.random() * 15 * (attempt + 1);
}

/** Entrée canonique dont dépend le hash — DOIT rester stable dans le temps
 *  (changer l'ordre/le format casserait la vérification des chaînes déjà
 *  écrites). `metadataStr` est la valeur EXACTE stockée en base (pas
 *  re-sérialisée), pour que la vérification recalcule sur ce qui est
 *  réellement persisté. */
function computeChainHash(entry: {
  prevHash: string;
  action: string;
  userId: string | null;
  metadataStr: string;
  success: boolean;
  createdAt: Date;
}): string {
  const payload = [
    entry.prevHash,
    entry.action,
    entry.userId ?? "",
    entry.metadataStr,
    String(entry.success),
    entry.createdAt.toISOString(),
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Écrit un enregistrement AuditLog chaîné. Protection contre les écritures
 * concurrentes par compare-and-swap via `updateMany` (même idiome que
 * `settleKonnectBooking`, src/lib/payments.ts) — jamais de SQL brut ni de
 * verrou explicite. `count === 0` = un autre writer a gagné la course entre
 * la lecture et l'écriture du pointeur : on relit et on retente.
 * Retourne `false` si la contention persiste après CHAIN_MAX_ATTEMPTS (la
 * ligne est alors écrite sans chaîne par l'appelant, jamais perdue).
 */
async function writeChainedAudit(entry: {
  action: AuditAction;
  userId: string | null;
  ip: string | null;
  metadataStr: string;
  success: boolean;
  createdAt: Date;
}): Promise<boolean> {
  for (let attempt = 0; attempt < CHAIN_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, chainRetryDelayMs(attempt)));
    }
    const state = await prisma.auditChainState.upsert({
      where: { id: CHAIN_ID },
      create: { id: CHAIN_ID, lastHash: CHAIN_GENESIS },
      update: {},
    });
    const prevHash = state.lastHash;
    const hash = computeChainHash({ ...entry, prevHash });

    const won = await prisma.$transaction(async (tx) => {
      const cas = await tx.auditChainState.updateMany({
        where: { id: CHAIN_ID, lastHash: prevHash },
        data: { lastHash: hash },
      });
      if (cas.count === 0) return false;
      await tx.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.userId,
          ip: entry.ip,
          metadata: entry.metadataStr,
          success: entry.success,
          createdAt: entry.createdAt,
          hash,
          prevHash,
        },
      });
      return true;
    });
    if (won) return true;
  }
  return false;
}

/**
 * Audit trail — chaque événement sensible est enregistré avec userId, IP et
 * métadonnées. Silencieux en cas d'échec d'écriture (ne doit jamais bloquer
 * le flux principal). Les actions de CHAINED_ACTIONS sont en plus chaînées
 * par hachage (§P3.5) ; le reste est écrit comme avant.
 */
export async function logAudit(params: {
  action: AuditAction;
  userId?: string;
  success?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const ip = await clientIp();
    const userId = params.userId ?? null;
    const metadataStr = JSON.stringify(params.metadata ?? {});
    const success = params.success ?? true;

    if (CHAINED_ACTIONS.has(params.action)) {
      const createdAt = new Date();
      const chained = await writeChainedAudit({
        action: params.action,
        userId,
        ip,
        metadataStr,
        success,
        createdAt,
      });
      if (chained) return;
      // Contention épuisée sur le pointeur de chaîne : ne jamais perdre
      // l'événement ni bloquer l'appelant — écrit sans hash (repérable :
      // action chaînée avec hash NULL, cf. scripts/verify-audit-chain.ts).
      logStructured("error", "audit_chain_contention", { action: params.action });
      await prisma.auditLog.create({
        data: { action: params.action, userId, ip, metadata: metadataStr, success, createdAt },
      });
      return;
    }

    await prisma.auditLog.create({
      data: { action: params.action, userId, ip, metadata: metadataStr, success },
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
