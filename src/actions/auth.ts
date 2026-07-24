"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { assertRateLimit, clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { logAudit, logStructured } from "@/lib/audit";
import { safeCallbackUrl, defaultLandingPath } from "@/lib/redirect";
import { issueOtp } from "@/lib/otp";
import { issueResetToken, consumeResetToken } from "@/lib/reset-token";
import { sendEmail, getEmailProvider } from "@/lib/mailer";
import { isValidCountry } from "@/lib/constants";
import { REFERRAL_SIGNUP_BONUS_TND, SITE_URL } from "@/lib/config";
import { findUserByReferralCode, issueCredit } from "@/lib/credits";

export type AuthFormState =
  | {
      error?: string;
      success?: string;
      email?: string;
      resetUrl?: string;
      // Valeurs non sensibles renvoyées pour repeupler le formulaire après une
      // erreur (jamais les mots de passe).
      values?: { name: string; email: string; phone: string; role: string };
    }
  | undefined;

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

const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(200),
    password: passwordSchema,
    // Confirmation saisie par l'utilisateur ; comparée au mot de passe ci-dessous.
    confirmPassword: z.string().max(200),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s]{8,16}$/)
      .optional()
      .or(z.literal("")),
    // Pays de résidence déclaré (pilotage diaspora). Validé contre le référentiel ;
    // toute valeur hors liste est ignorée (null) plutôt que rejetée.
    country: z.string().trim().max(60).optional().or(z.literal("")),
    // ADMIN ne peut pas être choisi à l'inscription — assigné manuellement en DB
    role: z.enum(["VOYAGEUR", "HOTE", "AGENCE"] as const),
    // Code de parrainage (CROISSANCE_ROADMAP.md §CR1), optionnel — transmis
    // via le lien de partage (?ref=CODE). Un code invalide/inconnu n'échoue
    // JAMAIS l'inscription, il est simplement ignoré (cf. registerAction).
    ref: z.string().trim().max(20).optional().or(z.literal("")),
  })
  // Marqueur dédié pour distinguer « mots de passe différents » des autres
  // erreurs de validation et afficher un message précis côté formulaire.
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "PASSWORD_MISMATCH",
  });

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const fr = await getT();
  if (!(await assertRateLimit("inscription"))) {
    return { error: fr.common.tropDeTentatives };
  }

  // Valeurs brutes renvoyées en cas d'erreur pour repeupler le formulaire
  // (sans jamais inclure les mots de passe).
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    role: String(formData.get("role") ?? ""),
  };

  // CAPTCHA anti-robot (no-op si désactivé). Vérifié AVANT toute écriture.
  const captchaOk = await verifyTurnstile(
    formData.get("cf-turnstile-response") as string | null,
    await clientIp()
  );
  if (!captchaOk) return { error: fr.auth.captchaEchec, values };

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    phone: formData.get("phone"),
    country: formData.get("country") ?? undefined,
    role: formData.get("role"),
    ref: formData.get("ref") ?? undefined,
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some(
      (i) => i.message === "PASSWORD_MISMATCH"
    );
    return {
      error: mismatch ? fr.auth.motDePasseNonIdentiques : fr.common.champsRequis,
      values,
    };
  }

  const { name, email, password, phone, country, role, ref } = parsed.data;
  // Pays validé contre le référentiel ; hors liste → null (jamais d'échec).
  const validCountry = country && isValidCountry(country) ? country : null;

  // Parrainage (§CR1) : code résolu AVANT la création — un code invalide/
  // inconnu vaut simplement absence de parrain, jamais une erreur bloquante.
  const referrer = ref ? await findUserByReferralCode(ref) : null;

  const existing = await prisma.user.findUnique({ where: { email } });

  // Choix produit (validé par Wassim) : on indique explicitement que l'e-mail
  // est déjà utilisé, à la manière des grands sites grand public — le lien
  // « se connecter » est juste sous le formulaire. Le risque d'énumération de
  // comptes est mitigé par le rate limiting de l'inscription (assertRateLimit
  // ci-dessus). La page de connexion, elle, garde un message générique.
  if (existing) {
    await logAudit({
      action: "REGISTER",
      success: false,
      metadata: { reason: "email_already_exists", email },
    });
    return { error: fr.auth.emailDejaUtilise, values };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      phone: phone || null,
      country: validCountry,
      role,
      // Posé UNE SEULE FOIS, ici, à la création — jamais modifié ensuite
      // (cf. schema.prisma, User.referredById).
      referredById: referrer?.id,
    },
  });

  await logAudit({
    action: "REGISTER",
    userId: user.id,
    success: true,
    metadata: { role, referred: Boolean(referrer) },
  });

  // Bonus filleul (§CR1), immédiat — jamais bloquant pour l'inscription (même
  // philosophie que l'envoi d'e-mail ci-dessous : un échec ici ne doit
  // JAMAIS empêcher le compte d'exister).
  if (referrer) {
    try {
      await issueCredit({
        userId: user.id,
        amount: REFERRAL_SIGNUP_BONUS_TND,
        motif: "BIENVENUE_PARRAINAGE",
      });
      await logAudit({
        action: "REFERRAL_SIGNUP_CREDIT_ISSUED",
        userId: user.id,
        success: true,
        metadata: { referrerId: referrer.id, amount: REFERRAL_SIGNUP_BONUS_TND },
      });
    } catch (err) {
      logStructured("error", "referral.signup_credit_failed", {
        userId: user.id,
        error: (err as Error).message,
      });
      await logAudit({ action: "REFERRAL_SIGNUP_CREDIT_ISSUED", userId: user.id, success: false });
    }
  }

  // Vérification d'email : on émet et envoie le code dès l'inscription. En mode
  // démo (EMAIL_PROVIDER absent/mock), rien n'est réellement envoyé — la page
  // /dashboard/email réaffichera le code. Un échec d'envoi ne doit JAMAIS casser
  // l'inscription (cohérence démo + filet en prod), d'où le try/catch silencieux.
  try {
    const code = await issueOtp(user.id, "EMAIL");
    await sendEmail({
      to: user.email,
      subject: fr.email.mailSujet,
      html: fr.email.mailCorpsHtml(code),
    });
    await logAudit({ action: "EMAIL_OTP_REQUESTED", userId: user.id, success: true });
  } catch {
    await logAudit({ action: "EMAIL_OTP_REQUESTED", userId: user.id, success: false });
  }

  return { success: fr.auth.inscriptionReussie, email };
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

  // CAPTCHA anti-robot / anti brute-force (no-op si désactivé), avant signIn.
  const captchaOk = await verifyTurnstile(
    formData.get("cf-turnstile-response") as string | null,
    await clientIp()
  );
  if (!captchaOk) return { error: fr.auth.captchaEchec };

  // Cible de redirection après connexion :
  //  • un `callbackUrl` explicite (ex. « devenir hôte ») prime, validé contre
  //    l'open redirect ;
  //  • sinon, atterrissage par défaut selon l'état de vérification du compte :
  //    page de vérification si incomplet, accueil si déjà vérifié.
  const rawCb = formData.get("callbackUrl") as string | null;
  let redirectTo: string;
  if (rawCb && safeCallbackUrl(rawCb, "") !== "") {
    redirectTo = safeCallbackUrl(rawCb);
  } else {
    const u = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: {
        role: true,
        emailVerified: true,
        phoneVerified: true,
        kycStatus: true,
      },
    });
    redirectTo = u ? defaultLandingPath(u) : "/dashboard";
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
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

// ── Réinitialisation de mot de passe ─────────────────────────────────────────

const requestResetSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
});

/**
 * Demande de réinitialisation. Anti-énumération : on renvoie TOUJOURS le même
 * message de succès, qu'un compte existe ou non pour l'adresse (OWASP). Si un
 * compte existe, on émet un jeton à usage unique et on envoie le lien par
 * e-mail. En mode démo (EMAIL_PROVIDER absent/mock), rien n'est envoyé → on
 * renvoie le lien (`resetUrl`) pour l'afficher à l'écran, comme l'OTP démo.
 */
export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const fr = await getT();
  if (!(await assertRateLimit("reset-request"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = requestResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true },
  });

  // Compte inconnu : message générique + délai aligné (anti-timing / anti-énumération).
  if (!user) {
    await logAudit({
      action: "PASSWORD_RESET_REQUESTED",
      success: false,
      metadata: { reason: "unknown_email", email: parsed.data.email },
    });
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 100));
    return { success: fr.auth.resetEmailEnvoye };
  }

  const token = await issueResetToken(user.id);
  const resetUrl = `${SITE_URL}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;

  // L'envoi ne doit jamais casser le flux (cohérence démo + filet en prod).
  let sent = false;
  try {
    sent = await sendEmail({
      to: user.email,
      subject: fr.auth.resetMailSujet,
      html: fr.auth.resetMailCorpsHtml(resetUrl),
    });
  } catch {
    // Silencieux : on renvoie quand même le message générique.
  }

  await logAudit({ action: "PASSWORD_RESET_REQUESTED", userId: user.id, success: true });

  // Démo (rien d'envoyé) : on surface le lien pour permettre de continuer.
  return getEmailProvider() === "demo" && !sent
    ? { success: fr.auth.resetEmailEnvoye, resetUrl }
    : { success: fr.auth.resetEmailEnvoye };
}

const resetPasswordSchema = z.object({
  token: z.string().trim().min(20).max(200),
  password: passwordSchema,
});

/**
 * Réinitialisation effective. Consomme le jeton (usage unique), pose le nouveau
 * mot de passe (bcrypt coût 12). Jeton invalide/expiré ⇒ message générique.
 *
 * NB : la stratégie de session est JWT (stateless) — l'invalidation des sessions
 * actives après reset nécessite un `tokenVersion` (cf. TODO-BETA, item dédié).
 */
export async function resetPasswordAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const fr = await getT();
  if (!(await assertRateLimit("reset-confirm"))) {
    return { error: fr.common.tropDeTentatives };
  }

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: fr.auth.resetMotDePasseInvalide };

  const userId = await consumeResetToken(parsed.data.token);
  if (!userId) return { error: fr.auth.resetLienInvalide };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });

  await logAudit({ action: "PASSWORD_RESET", userId, success: true });
  return { success: fr.auth.resetReussi };
}
