import { z } from "zod";

/**
 * Validation des variables d'environnement — exécutée au boot (fail-fast) via
 * src/instrumentation.ts. Empêche un démarrage silencieusement dégradé
 * (AUTH_SECRET absent/faible, DATABASE_URL manquant, SITE_URL non défini).
 * Konnect reste OPTIONNEL : absent ⇒ séquestre simulé (mode démo).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL requis"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET doit faire au moins 32 caractères"),
  SITE_URL: z.string().url().optional(),
  TRUSTED_PROXY: z.enum(["true", "false"]).optional(),
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
