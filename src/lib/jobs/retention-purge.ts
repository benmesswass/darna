import { prisma } from "@/lib/prisma";
import { captureError } from "@/lib/observability";
import {
  PRODUCT_EVENT_RETENTION_DAYS,
  PROPERTY_VIEW_RETENTION_DAYS,
  AUDIT_LOG_RETENTION_DAYS,
} from "@/lib/config";

const DAY = 24 * 60 * 60 * 1000;
const since = (days: number) => new Date(Date.now() - days * DAY);

/**
 * Job de purge de rétention (LANCEMENT_ROADMAP.md §L7.2) — rend RÉELLES les
 * durées annoncées sur `/confidentialite` (§Cookies, §Conservation) : sans ce
 * job, la page ferait une promesse non tenue, exactement le défaut reproché
 * à l'ancien bandeau « Refuser » sans effet (§L7, en-tête de cette section).
 *
 * Chaque entité est purgée isolément (une erreur sur l'une n'empêche pas les
 * autres, même patron que reconcileKonnectPayments) :
 *  - ProductEvent / PropertyView : régime CNIL « mesure d'audience », plafond
 *    légal 25 mois — ProductEvent utilise le plafond entier,
 *    PropertyView une fenêtre plus courte (13 mois, décision produit : la
 *    dédup de `viewCount` n'a pas besoin de plus, cf. `src/lib/config.ts`).
 *  - AuditLog : régime sécurité, ≥ 90 j exigés (TODO-PRODUCTION.md), 13 mois
 *    appliqués — jamais le même régime que la mesure d'audience, gardé
 *    séparé même si la valeur actuelle coïncide avec `darna-vid`.
 *  - PasswordResetToken / OtpChallenge : purgés dès expiration (aucune
 *    fenêtre de rétention légale à respecter, ce sont des jetons à usage
 *    unique déjà inertes une fois `expiresAt` dépassé).
 */
export async function purgeRetention(): Promise<Record<string, number>> {
  const summary: Record<string, number> = {};

  const targets: Array<{ name: string; purge: () => Promise<number> }> = [
    {
      name: "ProductEvent",
      purge: async () =>
        (
          await prisma.productEvent.deleteMany({
            where: { createdAt: { lt: since(PRODUCT_EVENT_RETENTION_DAYS) } },
          })
        ).count,
    },
    {
      name: "PropertyView",
      purge: async () =>
        (
          await prisma.propertyView.deleteMany({
            where: { createdAt: { lt: since(PROPERTY_VIEW_RETENTION_DAYS) } },
          })
        ).count,
    },
    {
      name: "AuditLog",
      purge: async () =>
        (
          await prisma.auditLog.deleteMany({
            where: { createdAt: { lt: since(AUDIT_LOG_RETENTION_DAYS) } },
          })
        ).count,
    },
    {
      name: "PasswordResetToken",
      purge: async () =>
        (
          await prisma.passwordResetToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
          })
        ).count,
    },
    {
      name: "OtpChallenge",
      purge: async () =>
        (
          await prisma.otpChallenge.deleteMany({
            where: { expiresAt: { lt: new Date() } },
          })
        ).count,
    },
  ];

  for (const target of targets) {
    try {
      summary[target.name] = await target.purge();
    } catch (err) {
      await captureError(err, { entity: target.name, phase: "retention-purge" });
      summary[target.name] = 0;
    }
  }

  return summary;
}
