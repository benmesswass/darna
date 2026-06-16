import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { logStructured } from "@/lib/audit";

const credentialsSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/connexion" },
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
        });

        // Message générique côté UI : on ne distingue jamais
        // « e-mail inconnu » de « mot de passe incorrect ».
        if (!user) {
          // Délai constant pour résister aux attaques de timing même quand
          // l'utilisateur n'existe pas (évite l'énumération par timing).
          // Hash bcrypt VALIDE (60 car., coût 12) : un hash mal formé serait
          // rejeté instantanément par bcrypt et la défense serait inopérante.
          await bcrypt.compare(parsed.data.password, "$2b$12$f/0oq4Vt.wjtcqw76TM1DONwSQqoVa/lcI0H/3sTvjhBSBTJBjYHG");
          logStructured("warn", "auth.login_failure", {
            reason: "user_not_found",
            email: parsed.data.email,
          });
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          logStructured("warn", "auth.login_failure", {
            reason: "invalid_password",
            userId: user.id,
          });
          return null;
        }

        logStructured("info", "auth.login_success", { userId: user.id });
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
});
