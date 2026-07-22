import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { VISITOR_COOKIE } from "@/lib/constants";

/**
 * Catalogue des événements produit — détail par phase dans
 * INSTRUMENTATION_ROADMAP.md. Chaque entrée s'ajoute dans la même PR que la
 * fonctionnalité qu'elle mesure (règle de discipline §IN4) : ne pas
 * pré-déclarer un événement pour une fonctionnalité qui n'existe pas encore.
 */
export const PRODUCT_EVENT_NAMES = [
  // Fondations (§IN0) — valide le pipe de bout en bout, câblé sur la fiche annonce.
  "LISTING_VIEWED",
  // Funnel de découverte (§IN1) — recherche → vue annonce → début réservation.
  "SEARCH_PERFORMED",
  "BOOKING_STARTED",
] as const;
export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

/** Id visiteur anonyme (cookie `darna-vid`, posé par le middleware). */
export async function getAnonId(): Promise<string | null> {
  const store = await cookies();
  return store.get(VISITOR_COOKIE)?.value ?? null;
}

/**
 * Événement produit — même contrat que `logAudit` (src/lib/audit.ts) :
 * écriture async, silencieuse en échec, ne bloque jamais l'appelant. Table
 * `ProductEvent`, distincte d'`AuditLog` (voir décision d'architecture dans
 * INSTRUMENTATION_ROADMAP.md).
 */
export async function logProductEvent(params: {
  event: ProductEventName;
  userId?: string | null;
  anonId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.productEvent.create({
      data: {
        event: params.event,
        userId: params.userId ?? null,
        anonId: params.anonId ?? null,
        metadata: JSON.stringify(params.metadata ?? {}),
      },
    });
  } catch (err) {
    // Même invariant que l'audit trail : ne doit jamais casser le flux produit.
    console.error("[PRODUCT_EVENT] write failed:", params.event, err);
  }
}
