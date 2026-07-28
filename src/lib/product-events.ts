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
  // Adoption de fonctionnalités déjà livrées (§IN2) — F4-F9/Yield Advisor
  // existent depuis longtemps sans aucune mesure d'usage.
  "SIMULATOR_USED",
  "SHARE_CLICKED",
  "SAVED_SEARCH_CREATED",
  "MAP_INTERACTED",
  // Relance de réservation abandonnée (§L3.3/G6) — mesure la reprise via
  // BOOKING_STARTED/BOOKING_CREATED existants après cet événement.
  "BOOKING_ABANDON_REMINDED",
  // Garantie non-conformité (§L5.3) — signalement déposé par un voyageur.
  "NON_CONFORMITY_REPORTED",
  // Pédagogie hôte Rail 2 (§L5.7) — activation du paiement sur place après
  // avoir vu le nouvel écran explicatif (4 blocs) et accepté les CGU hôte.
  "CASH_PAYMENT_ENABLED",
  // Friction d'entrée (§L8.1) — upgrade VOYAGEUR→HOTE/AGENCE en libre-service,
  // mesure l'effet de la suppression du rôle à l'inscription sur le funnel IN1.
  "ROLE_UPGRADED",
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
