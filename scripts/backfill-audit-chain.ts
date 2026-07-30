/**
 * Backfill du chaînage de hachage (ROADMAP.md §P3.5) sur les lignes AuditLog
 * déjà écrites AVANT l'introduction de la chaîne — établit une chaîne
 * cohérente sur l'historique existant (actions financières/identité
 * uniquement, cf. CHAINED_ACTIONS dans src/lib/audit.ts).
 *
 * IMPORTANT — ce que ça prouve et ce que ça ne prouve PAS : la chaîne ne
 * garantit l'absence d'altération qu'à PARTIR du moment où elle est établie.
 * Une ligne déjà modifiée avant ce backfill serait chaînée dans son état
 * actuel, sans que ça ne le révèle. C'est la limite inhérente à
 * l'introduction d'un chaînage sur un historique déjà existant — normal, pas
 * un bug de ce script.
 *
 * Lancement UNE SEULE FOIS, juste après la migration, avant toute écriture
 * chaînée en conditions réelles : npx tsx scripts/backfill-audit-chain.ts
 * Refuse de tourner si AuditChainState existe déjà avec une valeur non
 * "genesis" (protection contre un second lancement qui corromprait la
 * chaîne déjà active).
 */
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();
const CHAIN_ID = "singleton";
const CHAIN_GENESIS = "genesis";
const BATCH_SIZE = 200;

const CHAINED_ACTIONS = [
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
];

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

async function main() {
  const existingState = await prisma.auditChainState.findUnique({ where: { id: CHAIN_ID } });
  if (existingState && existingState.lastHash !== CHAIN_GENESIS) {
    throw new Error(
      "AuditChainState a déjà avancé (chaîne active) — ce script ne backfill que l'historique PRÉ-chaîne. Abandon pour ne pas corrompre la chaîne en cours."
    );
  }

  const total = await prisma.auditLog.count({
    where: { action: { in: CHAINED_ACTIONS }, hash: null },
  });
  console.log(`${total} ligne(s) historique(s) à chaîner.`);
  if (total === 0) {
    console.log("Rien à faire.");
    return;
  }

  let prevHash = CHAIN_GENESIS;
  let done = 0;
  let cursor: string | undefined;
  for (;;) {
    const batch = await prisma.auditLog.findMany({
      where: { action: { in: CHAINED_ACTIONS }, hash: null },
      select: { id: true, action: true, userId: true, metadata: true, success: true, createdAt: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (batch.length === 0) break;

    for (const row of batch) {
      const hash = computeChainHash({
        prevHash,
        action: row.action,
        userId: row.userId,
        metadataStr: row.metadata,
        success: row.success,
        createdAt: row.createdAt,
      });
      await prisma.auditLog.update({
        where: { id: row.id },
        data: { hash, prevHash },
      });
      prevHash = hash;
      done += 1;
    }
    cursor = batch[batch.length - 1].id;
    console.log(`${done}/${total} chaîné(s).`);
  }

  await prisma.auditChainState.upsert({
    where: { id: CHAIN_ID },
    create: { id: CHAIN_ID, lastHash: prevHash },
    update: { lastHash: prevHash },
  });

  console.log("Backfill terminé. Chaîne prête pour les écritures en direct.");
}

main()
  .catch((e) => {
    console.error("Backfill interrompu :", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
