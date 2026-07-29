"use server";

import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { assertRateLimit, clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export type ContactFormState = { error?: string; success?: string } | undefined;

const contactSchema = z.object({
  propertyId: z.string().cuid(),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().regex(/^\+?[0-9\s]{8,16}$/),
  message: z.string().trim().min(10).max(2000),
});

export async function createContactRequestAction(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const fr = await getT();
  if (!(await assertRateLimit("contact"))) {
    return { error: fr.common.tropDeTentatives };
  }

  // CAPTCHA anti-robot (no-op si désactivé). Vérifié AVANT toute écriture.
  const captchaOk = await verifyTurnstile(
    formData.get("cf-turnstile-response") as string | null,
    await clientIp()
  );
  if (!captchaOk) return { error: fr.auth.captchaEchec };

  const parsed = contactSchema.safeParse({
    propertyId: formData.get("propertyId"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  // L'annonce doit exister et accepter le contact (location ou vente).
  const property = await prisma.property.findUnique({
    where: { id: parsed.data.propertyId },
    select: { id: true, type: true, status: true },
  });
  if (!property || property.type === "SEJOUR" || property.status !== "ACTIVE") {
    return { error: fr.common.erreurInconnue };
  }

  const user = await getSessionUser();

  await prisma.contactRequest.create({
    data: {
      propertyId: property.id,
      senderId: user?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
    },
  });

  return { success: fr.contact.envoye };
}
