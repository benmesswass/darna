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
  // Stockage des images (cf. src/lib/storage.ts). "disk" (défaut, démo) ou "s3".
  STORAGE_DRIVER: z.enum(["disk", "s3"]).optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_PUBLIC_URL: z.string().url().optional(),
  // Chiffrement au repos des données sensibles (CIN, cf. src/lib/crypto.ts).
  // Optionnel : absent ⇒ stockage en clair (comportement actuel).
  KYC_ENC_KEY: z.string().min(16).optional(),
}).refine(
  (e) =>
    e.STORAGE_DRIVER !== "s3" ||
    Boolean(e.S3_ENDPOINT && e.S3_BUCKET && e.S3_ACCESS_KEY_ID && e.S3_SECRET_ACCESS_KEY),
  {
    message:
      "STORAGE_DRIVER=s3 requiert S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID et S3_SECRET_ACCESS_KEY",
  }
);

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "[env] Configuration invalide :",
    JSON.stringify(parsed.error.flatten())
  );
  throw new Error("Variables d'environnement invalides — démarrage interrompu.");
}

export const env: Env = parsed.data;
