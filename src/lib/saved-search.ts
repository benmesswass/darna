/**
 * Alertes de recherche sauvegardée (F7) : notifie (in-app + e-mail) les
 * voyageurs dont l'alerte (ville + budget) correspond à une annonce séjour qui
 * vient de devenir active. Déclenché à l'ÉVÉNEMENT (verifyPropertyAction),
 * jamais par cron — même principe que le reste du projet (pas de tâche
 * planifiée). Module SERVEUR uniquement.
 */

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { fr as frMail } from "@/lib/i18n/fr";
import { formatTndServer } from "@/lib/format";
import { logStructured } from "@/lib/audit";
import { SITE_URL } from "@/lib/config";
import { notifyNewListingMatch } from "@/lib/notification-center";

export async function notifyMatchingSavedSearches(propertyId: string): Promise<void> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { type: true, city: true, price: true, slug: true, title: true },
  });
  // Alerte scopée aux séjours : c'est la seule verticale avec une barre de
  // recherche « ville + budget » sur laquelle une alerte peut être créée.
  if (!property || property.type !== "SEJOUR") return;

  const searches = await prisma.savedSearch.findMany({
    where: {
      city: property.city,
      AND: [
        { OR: [{ prixMin: null }, { prixMin: { lte: property.price } }] },
        { OR: [{ prixMax: null }, { prixMax: { gte: property.price } }] },
      ],
    },
    select: { userId: true, user: { select: { email: true, name: true } } },
  });
  if (!searches.length) return;

  const href = `/annonce/${property.slug}`;
  const url = `${SITE_URL}${href}`;

  await Promise.all(
    searches.map(async (s) => {
      // Jamais bloquant : une alerte manquée ne doit jamais faire échouer la
      // vérification de l'annonce qui la déclenche.
      try {
        await notifyNewListingMatch(s.userId, property.title, href);
      } catch (err) {
        logStructured("error", "saved_search.notif_failed", {
          userId: s.userId,
          error: (err as Error).message,
        });
      }
      try {
        await sendEmail({
          to: s.user.email,
          subject: frMail.email.savedSearchMatchSujet(property.city),
          html: frMail.email.savedSearchMatchHtml({
            recipientName: s.user.name,
            propertyTitle: property.title,
            city: property.city,
            price: formatTndServer(property.price),
            url,
          }),
        });
      } catch (err) {
        logStructured("error", "saved_search.email_failed", {
          userId: s.userId,
          error: (err as Error).message,
        });
      }
    })
  );
}
