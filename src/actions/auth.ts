"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { fr } from "@/lib/i18n/fr";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { ROLES } from "@/lib/constants";

export type AuthFormState = { error?: string; success?: string } | undefined;

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s]{8,16}$/)
    .optional()
    .or(z.literal("")),
  role: z.enum(ROLES),
});

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
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
  // Message volontairement générique : ne révèle pas qu'un compte existe.
  if (existing) return { error: fr.auth.emailDejaUtilise };

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, passwordHash, phone: phone || null, role },
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
  if (!(await assertRateLimit("connexion"))) {
    return { error: fr.common.tropDeTentatives };
  }

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
