import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { logStructured } from "@/lib/audit";
import { trackLoginFailure } from "@/lib/login-failure-tracking";
import { isGoogleAuthEnabled } from "@/lib/google-auth";
import { resolveGoogleUser } from "@/lib/google-account-linking";

const credentialsSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/connexion" },
  // Requis pour que le flux OAuth (redirection callback) fonctionne derrière
  // un proxy/CDN (Vercel, ce sandbox…) — sans lien avec TRUSTED_PROXY
  // (src/lib/rate-limit.ts), qui régit la résolution d'IP, pas la confiance
  // NextAuth dans l'en-tête Host.
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        // Rate limiting : couvre l'action ET l'endpoint NextAuth direct.
        if (!(await assertRateLimit("connexion"))) {
          logStructured("warn", "auth.rate_limit_exceeded", {
            email: typeof credentials?.email === "string" ? credentials.email : "unknown",
          });
          return null;
        }

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            tokenVersion: true,
          },
        });

        // Message générique côté UI : on ne distingue jamais
        // « e-mail inconnu » de « mot de passe incorrect ».
        // Compte inconnu OU compte Google-only (passwordHash null, §L8.2) :
        // même traitement anti-énumération — délai constant via un hash de
        // leurre, message générique, jamais de distinction pour l'appelant.
        if (!user || !user.passwordHash) {
          // Hash bcrypt VALIDE (60 car., coût 12) : un hash mal formé serait
          // rejeté instantanément par bcrypt et la défense serait inopérante.
          // Faux positif Semgrep assumé : hash factice de leurre, jamais un vrai secret.
          await bcrypt.compare(parsed.data.password, "$2b$12$f/0oq4Vt.wjtcqw76TM1DONwSQqoVa/lcI0H/3sTvjhBSBTJBjYHG"); // nosemgrep: generic.secrets.security.detected-bcrypt-hash.detected-bcrypt-hash
          await trackLoginFailure({
            reason: user ? "google_only_account" : "user_not_found",
            email: parsed.data.email,
            userId: user?.id,
          });
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          await trackLoginFailure({ reason: "invalid_password", userId: user.id });
          return null;
        }

        logStructured("info", "auth.login_success", { userId: user.id });
        return { id: user.id, name: user.name, email: user.email, tokenVersion: user.tokenVersion };
      },
    }),
    // Google (§L8.2) — opt-in : absent tant que GOOGLE_CLIENT_ID/SECRET ne
    // sont pas posés (isGoogleAuthEnabled(), garanti complet au boot par
    // src/lib/env.ts). Provider unique retenu à ce stade (pas de Facebook/Apple).
    ...(isGoogleAuthEnabled()
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    /**
     * Sans adaptateur DB (session JWT pure), NextAuth ne fait AUCUN lien
     * automatique entre un compte Google et un `User` Darna — ce callback
     * s'en charge via resolveGoogleUser (trouve OU crée le `User` par
     * e-mail), puis substitue son id RÉEL à l'id Google (`user.id` =
     * `profile.sub` par défaut) avant que `jwt()` ne le lise (même objet
     * propagé d'un callback à l'autre dans une requête de connexion).
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = profile?.email;
      if (!email) return false;

      const dbUser = await resolveGoogleUser({
        email,
        name: profile?.name,
        picture: typeof profile?.picture === "string" ? profile.picture : null,
      });

      user.id = dbUser.id;
      (user as { tokenVersion?: number }).tokenVersion = dbUser.tokenVersion;

      return true;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
        token.tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0;
      }
      return token;
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      if (token.tokenVersion !== undefined) session.user.tokenVersion = token.tokenVersion as number;
      return session;
    },
  },
});
