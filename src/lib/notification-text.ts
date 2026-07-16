import type { Dictionary } from "@/lib/i18n/fr";

/** Item générique — même forme que la réponse JSON de /api/notifications. */
export type NotificationItem = {
  id: string;
  type: string;
  propertyTitle: string | null;
  href: string | null;
  createdAt: string;
  readAt: string | null;
};

/**
 * Compose le libellé affiché d'une notification dans la locale courante.
 * Jamais de texte figé en base (cf. modèle Notification) — uniquement ici,
 * côté affichage, à partir du type + des paramètres stockés.
 */
export function notificationMessage(
  fr: Dictionary,
  n: Pick<NotificationItem, "type" | "propertyTitle">
): string {
  switch (n.type) {
    case "RESERVATION_CONFIRMEE":
      return fr.notifications.reservationConfirmee(n.propertyTitle ?? "");
    case "RESERVATION_ANNULEE":
      return fr.notifications.reservationAnnulee(n.propertyTitle ?? "");
    case "AVIS_RECU":
      return fr.notifications.avisRecu(n.propertyTitle ?? "");
    case "AVIS_HOTE_RECU":
      return fr.notifications.avisHoteRecu;
    case "ANNONCE_EXPIRE_BIENTOT":
      return fr.notifications.annonceExpireBientot(n.propertyTitle ?? "");
    case "ALERTE_NOUVELLE_ANNONCE":
      return fr.notifications.alerteNouvelleAnnonce(n.propertyTitle ?? "");
    case "DEMANDE_CASH_RECUE":
      return fr.notifications.demandeCashRecue(n.propertyTitle ?? "");
    case "RESERVATION_REFUSEE":
      return fr.notifications.reservationRefusee(n.propertyTitle ?? "");
    case "RESERVATION_ANNULEE_PAR_HOTE":
      return fr.notifications.reservationAnnuleeParHote(n.propertyTitle ?? "");
    case "ANNONCE_MASQUEE_ANNULATION":
      return fr.notifications.annonceMasqueeAnnulation(n.propertyTitle ?? "");
    case "HOST_INVOICE_RELANCE":
      return fr.notifications.hostInvoiceRelance(n.propertyTitle ?? "");
    case "FACTURE_BIENTOT_DUE":
      return fr.notifications.factureBientotDue(n.propertyTitle ?? "");
    case "FACTURE_EN_RETARD":
      return fr.notifications.factureEnRetard(n.propertyTitle ?? "");
    case "ANNONCE_LIMITE_ABONNEMENT":
      return fr.notifications.annonceLimiteAbonnement(n.propertyTitle ?? "");
    default:
      return "";
  }
}
