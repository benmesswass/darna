"use server";

import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { assertRateLimit, clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { notifyAdmins } from "@/lib/admin-notify";

export type WakilFormState = { error?: string; success?: string } | undefined;

const wakilSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().regex(/^\+?[0-9\s]{8,16}$/),
  city: z.string().trim().min(2).max(60),
  motivation: z.string().trim().min(20).max(2000),
});

export async function applyWakilAction(
  _prev: WakilFormState,
  formData: FormData
): Promise<WakilFormState> {
  const fr = await getT();
  if (!(await assertRateLimit("wakil"))) {
    return { error: fr.common.tropDeTentatives };
  }

  // CAPTCHA anti-robot (no-op si désactivé). Vérifié AVANT toute écriture.
  const captchaOk = await verifyTurnstile(
    formData.get("cf-turnstile-response") as string | null,
    await clientIp()
  );
  if (!captchaOk) return { error: fr.auth.captchaEchec };

  const parsed = wakilSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    motivation: formData.get("motivation"),
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  await prisma.wakilApplication.create({ data: parsed.data });

  // Fire-and-forget
  void notifyAdmins("NEW_WAKIL_APPLICATION", {
    name: parsed.data.name,
    email: parsed.data.email,
    city: parsed.data.city,
  });

  return { success: fr.wakil.candidatureEnvoyee };
}
