"use server";

import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";

export type FinancingLeadFormState = { error?: string; success?: string } | undefined;

const schema = z.object({
  propertyId: z.string().cuid(),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().regex(/^\+?[0-9\s]{8,16}$/),
  desiredAmount: z.coerce.number().int().min(1000).max(10_000_000).optional(),
  message: z.string().trim().max(2000).optional(),
});

/**
 * Apport d'affaires financement (MONETISATION_IMMO_ROADMAP.md §MI5) —
 * capture du lead uniquement, aucune monétisation (bloquée tant qu'aucun
 * partenariat bancaire n'est signé). VENTE seulement : un financement est un
 * prêt à l'achat, n'a pas de sens pour une location longue durée.
 */
export async function submitFinancingLeadAction(
  _prev: FinancingLeadFormState,
  formData: FormData
): Promise<FinancingLeadFormState> {
  const fr = await getT();
  if (!(await assertRateLimit("financing-lead"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = schema.safeParse({
    propertyId: formData.get("propertyId"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    desiredAmount: formData.get("desiredAmount") || undefined,
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const property = await prisma.property.findUnique({
    where: { id: parsed.data.propertyId },
    select: { id: true, type: true, status: true },
  });
  if (!property || property.type !== "VENTE" || property.status !== "ACTIVE") {
    return { error: fr.common.erreurInconnue };
  }

  const user = await getSessionUser();

  await prisma.financingLead.create({
    data: {
      propertyId: property.id,
      senderId: user?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      desiredAmount: parsed.data.desiredAmount ?? null,
      message: parsed.data.message ?? null,
    },
  });

  return { success: fr.financement.envoye };
}
