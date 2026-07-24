"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/product-events";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.string().min(1).max(50);

/**
 * Incrémente Property.viewCount UNE SEULE FOIS par visiteur (contrainte
 * unique PropertyView) — anti-inflation : sans cette dédup, un visiteur qui
 * rafraîchit la page (ou un script) gonflerait artificiellement le compteur.
 * Best-effort, lecture seule pour l'appelant (aucun retour, jamais bloquant).
 */
export async function recordListingViewAction(propertyId: string): Promise<void> {
  const parsed = schema.safeParse(propertyId);
  if (!parsed.success) return;

  // Pas de cookie visiteur (cookies désactivés) → dédup impossible à garantir,
  // on préfère ne rien compter plutôt que de risquer un comptage gonflé.
  const anonId = await getAnonId();
  if (!anonId) return;

  if (!(await rateLimit("listing-view", anonId))) return;

  try {
    await prisma.propertyView.create({ data: { propertyId: parsed.data, anonId } });
  } catch {
    // Contrainte unique (déjà compté pour ce visiteur) ou annonce introuvable
    // (FK) : rien à incrémenter, échec silencieux dans les deux cas.
    return;
  }

  await prisma.property
    .update({ where: { id: parsed.data }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});
}
