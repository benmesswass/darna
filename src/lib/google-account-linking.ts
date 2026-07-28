import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

/**
 * Résout (trouve ou crée) le compte Darna correspondant à un e-mail Google
 * vérifié — LANCEMENT_ROADMAP.md §L8.2. Module SÉPARÉ de src/lib/auth.ts, pour
 * la même raison que trackLoginFailure (src/lib/login-failure-tracking.ts) :
 * importer next-auth dans un test unitaire échoue systématiquement
 * (résolution next/server), donc toute logique testable doit vivre hors de
 * ce fichier.
 *
 * Liaison automatique par e-mail : SÛRE uniquement parce que Google a déjà
 * vérifié la propriété de l'adresse — le scénario de takeover (« un
 * attaquant crée un compte Google avec l'e-mail de la victime ») est
 * impossible par construction, contrairement à un provider qui ne
 * vérifierait pas l'e-mail. C'est pourquoi seul Google bénéficie de cette
 * liaison automatique (décision actée, LANCEMENT_ROADMAP.md §L8.2).
 */
export async function resolveGoogleUser(params: {
  email: string;
  name: string | null | undefined;
  picture: string | null | undefined;
}): Promise<{ id: string; tokenVersion: number }> {
  const email = params.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, tokenVersion: true },
  });
  if (existing) return existing;

  const created = await prisma.user.create({
    data: {
      email,
      name: params.name ?? email,
      passwordHash: null,
      // Google a déjà vérifié la propriété de l'adresse.
      emailVerified: true,
      image: params.picture ?? null,
    },
    select: { id: true, tokenVersion: true },
  });

  await logAudit({
    action: "REGISTER",
    userId: created.id,
    success: true,
    metadata: { via: "google" },
  });

  return created;
}
