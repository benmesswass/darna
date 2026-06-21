"use server";

import { z } from "zod";
import { getDestinationPreview, type DestinationPreview } from "@/lib/destination";

/**
 * Aperçu destination pour la modale de recherche (lecture seule). Exposé en
 * server action car appelé à la demande côté client (au fil de la saisie ville
 * / des dates). zod borne les entrées ; aucune mutation, aucune donnée sensible.
 */
const schema = z.object({
  ville: z.string().max(80).optional(),
  arrivee: z.string().max(10).optional(),
  depart: z.string().max(10).optional(),
  voyageurs: z.string().max(3).optional(),
});

export async function destinationPreviewAction(
  input: unknown
): Promise<DestinationPreview | null> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return null;
  return getDestinationPreview(parsed.data);
}
