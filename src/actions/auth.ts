"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export type AuthFormState = { error?: string; success?: string } | undefined;

/**
 * Politique de mot de passe :
 * - ≥ 8 caractères
 * - contient au moins un chiffre
 * Conforme NIST 800-63B : la longueur prime sur la complexité.
 * Évolution : passer à ≥ 12 caractères à la prochaine itération.
 */
const passwordSchema = z
  .string()
  .min(8, "Au moins 8 caractères requis")
  .max(200)
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre");

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  password: passwordSchema,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s]{8,16}$/)
    .optional()
    .or(z.literal("")),
  // ADMIN ne peut pas être choisi à l'inscription — assigné manuellement en DB
  role: z.enum(["VOYAGEUR", "HOTE", "AGENCE"] as const),
});

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const fr = await getT();
  if (!(await assertRateLimit("inscription"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const { name, email, password, phone, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });

  // Message générique : ne révèle PAS qu'un compte existe déjà pour cet email.
  // (Anti account-enumeration — OWASP Authentication Cheat Sheet)
  // Le comportement correct en production est d'envoyer un email "compte déjà existant"
  // à l'adresse concernée, et d'afficher le même message succès dans tous les cas.
  // TODO : brancher un provider email (Resend / Mailgun) pour ce flow.
  if (existing) {
    await logAudit({
      action: "REGISTER",
      success: false,
      metadata: { reason: "email_already_exists", email },
    });
    // Délai artificiel pour aligner le timing avec une vraie insertion (anti-timing)
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 100));
    return { success: fr.auth.inscriptionReussie };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone: phone || null, role },
  });

  await logAudit({
    action: "REGISTER",
    userId: user.id,
    success: true,
    metadata: { role },
  });

  return { success: fr.auth.inscriptionReussie };
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const fr = await getT();
  // Le rate limiting de la connexion vit dans `authorize` (src/lib/auth.ts) :
  // un seul point de contrôle couvre l'action ET l'endpoint NextAuth.
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: fr.auth.identifiantsInvalides };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: fr.auth.identifiantsInvalides };
    }
    throw error; // NEXT_REDIRECT : laisser passer la redirection.
  }
  return undefined;
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
