"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { resolveCity } from "@/lib/geo";
import { getAnonId, logProductEvent } from "@/lib/product-events";

export type SavedSearchFormState = { error?: string; success?: string } | undefined;

const schema = z.object({
  ville: z.string().trim().min(1),
  prixMin: z.coerce.number().int().min(0).optional().or(z.literal("")),
  prixMax: z.coerce.number().int().min(0).optional().or(z.literal("")),
});

/** Enregistre une alerte (ville + budget) — un voyageur connecté uniquement. */
export async function saveSearchAction(
  _prev: SavedSearchFormState,
  formData: FormData
): Promise<SavedSearchFormState> {
  const fr = await getT();
  const user = await requireUser();

  const parsed = schema.safeParse({
    ville: formData.get("ville"),
    prixMin: formData.get("prixMin") || "",
    prixMax: formData.get("prixMax") || "",
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const city = resolveCity(parsed.data.ville);
  if (!city) return { error: fr.common.champsRequis };

  try {
    await prisma.savedSearch.create({
      data: {
        userId: user.id,
        city,
        prixMin: parsed.data.prixMin ? Number(parsed.data.prixMin) : null,
        prixMax: parsed.data.prixMax ? Number(parsed.data.prixMax) : null,
      },
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return { error: fr.search.alerteExisteDeja };
    }
    throw err;
  }

  // Instrumentation produit (INSTRUMENTATION_ROADMAP.md §IN2).
  await logProductEvent({
    event: "SAVED_SEARCH_CREATED",
    userId: user.id,
    anonId: await getAnonId(),
    metadata: {
      city,
      prixMin: parsed.data.prixMin ? Number(parsed.data.prixMin) : null,
      prixMax: parsed.data.prixMax ? Number(parsed.data.prixMax) : null,
    },
  });

  revalidatePath("/dashboard/alertes");
  return { success: fr.search.alerteEnregistree };
}

const idSchema = z.string().cuid();

/** Supprime une alerte — uniquement la sienne. */
export async function deleteSavedSearchAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;
  await prisma.savedSearch.deleteMany({ where: { id: parsed.data, userId: user.id } });
  revalidatePath("/dashboard/alertes");
}
