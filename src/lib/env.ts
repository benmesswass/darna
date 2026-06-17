import { z } from "zod";

/**
 * Validation des variables d'environnement — exécutée au boot (fail-fast) via
 * src/instrumentation.ts. Empêche un démarrage silencieusement dégradé
 * (AUTH_SECRET absent/faible, DATABASE_URL manquant, SITE_URL non défini).
 * Konnect reste OPTIONNEL : absent ⇒ séquestre simulé (mode démo).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL requis"),
  // Connexion directe pour les migrations (cf. schema.prisma). Optionnelle : si
  // absente, src/lib/prisma.ts la fait retomber sur DATABASE_URL (démo sans pooler).
  DIRECT_URL: z.string().optional(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET doit faire au moins 32 caractères"),
  SITE_URL: z.string().url().optional(),
  TRUSTED_PROXY: z.enum(["true", "false"]).optional(),
  // Cache + rate limiting distribués (OPTIONNEL). Absent ⇒ fallback in-memory
  // mono-instance (cf. src/lib/redis.ts). À définir en prod multi-instance.
  REDIS_URL: z.string().url().optional(),
  KONNECT_API_KEY: z.string().optional(),
  KONNECT_RECEIVER_WALLET_ID: z.string().optional(),
  KONNECT_API_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "[env] Configuration invalide :",
    JSON.stringify(parsed.error.flatten().fieldErrors)
  );
  throw new Error("Variables d'environnement invalides — démarrage interrompu.");
}

export const env: Env = parsed.data;
