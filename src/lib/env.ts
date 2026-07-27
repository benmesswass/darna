import { z } from "zod";

/**
 * Validation des variables d'environnement — exécutée au boot (fail-fast) via
 * src/instrumentation.ts. Empêche un démarrage silencieusement dégradé
 * (AUTH_SECRET absent/faible, DATABASE_URL manquant) ET garantit qu'on ne peut
 * pas activer un mode PRODUCTION à moitié configuré (paiement réel sans clés,
 * KYC réel sans chiffrement/SMS, S3 sans bucket, prod sans proxy de confiance).
 *
 * Invariant clé : tous les modes défaut = DÉMO. Le mode démo démarre donc TOUJOURS
 * sans clé. Les contrôles stricts ci-dessous ne se déclenchent QUE lorsqu'un mode
 * réel est explicitement demandé → le passage en prod est sûr par construction.
 */
const envSchema = z
  .object({
    NODE_ENV: z.string().optional(),
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

    // ── Modes DÉMO ↔ PRODUCTION (cf. src/lib/modes.ts) ────────────────────────
    // Paiement : "demo" (séquestre simulé, défaut) | "konnect" (réel).
    PAYMENT_MODE: z.enum(["demo", "konnect"]).optional(),
    // KYC : "demo" (OTP affiché, statut DEMO_VERIFIE, défaut) | "production" (SMS réel).
    KYC_MODE: z.enum(["demo", "production"]).optional(),
    // Stockage : "local" (disque, défaut) | "s3". STORAGE_DRIVER conservé en rétro-compat.
    STORAGE_MODE: z.enum(["local", "s3"]).optional(),
    STORAGE_DRIVER: z.enum(["disk", "s3"]).optional(),

    // Verticales (cf. src/lib/modes.ts). Absent ⇒ activée (défaut démo complète).
    // "false" désactive la verticale. Les deux ne peuvent pas être "false".
    STAY_ENABLED: z.enum(["true", "false"]).optional(),
    IMMO_ENABLED: z.enum(["true", "false"]).optional(),

    KONNECT_API_KEY: z.string().optional(),
    KONNECT_RECEIVER_WALLET_ID: z.string().optional(),
    KONNECT_API_URL: z.string().url().optional(),
    // Secret de signature du webhook Konnect (HMAC de l'URL qu'on fournit à
    // l'init — Konnect ne signe pas ses webhooks). OPTIONNEL : à défaut, dérivé
    // d'AUTH_SECRET (cf. src/lib/konnect.ts). À poser pour une rotation
    // indépendante du secret d'auth. ≥16 caractères s'il est fourni.
    KONNECT_WEBHOOK_SECRET: z.string().min(16).optional(),

    S3_ENDPOINT: z.string().url().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_PUBLIC_URL: z.string().url().optional(),

    // Chiffrement au repos des données sensibles (CIN, cf. src/lib/crypto.ts).
    // Optionnel en démo ; OBLIGATOIRE dès KYC_MODE=production (cf. superRefine).
    KYC_ENC_KEY: z.string().min(16).optional(),
    // Provider SMS réel (Twilio, passerelle TN…). Requis dès KYC_MODE=production.
    SMS_PROVIDER: z.string().optional(),
    // Identifiants Twilio. Requis (boot fail-fast) si SMS_PROVIDER=twilio.
    // TWILIO_FROM : numéro expéditeur E.164 OU Messaging Service SID (préfixe "MG").
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_FROM: z.string().optional(),

    // PR3 — Gating KYC sur la création d'annonces.
    // "on" = seuls les utilisateurs vérifiés peuvent publier.
    KYC_GATING: z.enum(["on", "off"]).optional(),

    // PR4 — Canal OTP : "sms" (défaut) | "meta-whatsapp".
    OTP_PROVIDER: z.enum(["sms", "meta-whatsapp"]).optional(),
    // Requis si OTP_PROVIDER=meta-whatsapp. Deux jeux de noms acceptés :
    // les noms historiques (META_WHATSAPP_*) et les alias documentés
    // dans la checklist Meta (META_WABA_*). L'un OU l'autre suffit.
    META_WHATSAPP_ACCESS_TOKEN: z.string().optional(),
    META_WHATSAPP_PHONE_ID: z.string().optional(),
    META_WABA_TOKEN: z.string().optional(),
    META_WABA_PHONE_NUMBER_ID: z.string().optional(),
    // Template WhatsApp (défauts : "authentication" / "fr"). Optionnels.
    META_WA_TEMPLATE_NAME: z.string().optional(),
    META_WA_TEMPLATE_LANG: z.string().optional(),
    // Version de l'API Graph (défaut "v21.0"). Optionnel — pour migrer sans déployer.
    META_GRAPH_API_VERSION: z.string().regex(/^v\d+\.\d+$/).optional(),

    // PR5 — Provider e-mail : absent/"demo" (aucun envoi) | "resend".
    EMAIL_PROVIDER: z.enum(["demo", "resend"]).optional(),
    // Requis si EMAIL_PROVIDER=resend.
    RESEND_API_KEY: z.string().optional(),
    // Adresse expéditeur (ex. "Darna <noreply@darna.tn>").
    EMAIL_FROM: z.string().optional(),

    // Observabilité erreurs : POST opt-in des exceptions (cf. src/lib/observability.ts).
    OBSERVABILITY_WEBHOOK_URL: z.string().url().optional(),

    // L3.1 (LANCEMENT_ROADMAP.md) — secret du endpoint /api/jobs/tick (Vercel
    // Cron envoie `Authorization: Bearer ${CRON_SECRET}` automatiquement quand
    // la variable existe). Requis (boot fail-fast) dès qu'un mode réel est
    // actif — cf. superRefine ci-dessous.
    CRON_SECRET: z.string().min(32, "CRON_SECRET doit faire au moins 32 caractères").optional(),

    // CAPTCHA anti-robot : absent/"off" (aucun, défaut) | "turnstile" (Cloudflare).
    CAPTCHA_MODE: z.enum(["off", "turnstile"]).optional(),
    // Requis si CAPTCHA_MODE=turnstile (cf. superRefine). La site key est publique.
    TURNSTILE_SECRET_KEY: z.string().optional(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),

    // L4.2 (LANCEMENT_ROADMAP.md) — Sentry, actif seulement si défini (défaut
    // démo sûr, comme tous les modes). Le DSN n'est pas un secret par
    // conception Sentry (il ne permet qu'ENVOYER des events, jamais de les
    // lire) — NEXT_PUBLIC_SENTRY_DSN est donc la même valeur que SENTRY_DSN,
    // dupliquée pour être inlinée côté client (cf. superRefine : les deux
    // doivent être posées ensemble).
    SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  })
  .superRefine((e, ctx) => {
    // Au moins une verticale doit rester active : un site sans Séjours NI Immo
    // n'a aucun contenu. Désactiver les deux est forcément une erreur de config.
    if (e.STAY_ENABLED === "false" && e.IMMO_ENABLED === "false") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "STAY_ENABLED et IMMO_ENABLED ne peuvent pas valoir \"false\" simultanément : au moins une verticale doit rester active.",
      });
    }

    const isProd = e.NODE_ENV === "production";
    const paymentKonnect = e.PAYMENT_MODE === "konnect";
    const kycProd = e.KYC_MODE === "production";
    const storageS3 = e.STORAGE_MODE === "s3" || e.STORAGE_DRIVER === "s3";
    const anyRealMode = paymentKonnect || kycProd || storageS3;

    // B4 — paiement réel : config Konnect complète exigée.
    if (paymentKonnect && !(e.KONNECT_API_KEY && e.KONNECT_RECEIVER_WALLET_ID)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "PAYMENT_MODE=konnect requiert KONNECT_API_KEY et KONNECT_RECEIVER_WALLET_ID.",
      });
    }

    // CAPTCHA réel : les deux clés Turnstile sont exigées (sinon widget côté
    // client OU vérification serveur inopérants → fail-closed silencieux).
    if (
      e.CAPTCHA_MODE === "turnstile" &&
      !(e.TURNSTILE_SECRET_KEY && e.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "CAPTCHA_MODE=turnstile requiert TURNSTILE_SECRET_KEY et NEXT_PUBLIC_TURNSTILE_SITE_KEY.",
      });
    }

    // B3 — CIN jamais en clair en prod KYC : clé de chiffrement obligatoire.
    if (kycProd && !e.KYC_ENC_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "KYC_MODE=production requiert KYC_ENC_KEY (chiffrement AES-256 de la CIN au repos — interdiction de stocker en clair).",
      });
    }
    // B2 — KYC réel : SMS réel obligatoire (aucun code OTP retourné au client).
    if (kycProd && !e.SMS_PROVIDER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "KYC_MODE=production requiert SMS_PROVIDER (envoi SMS réel ; le code OTP ne doit jamais être renvoyé au client).",
      });
    }

    // B2b — provider Twilio : identifiants complets exigés (sinon l'envoi réel
    // planterait au runtime). Couvre aussi le repli WhatsApp→SMS (otp-channel.ts).
    if (
      e.SMS_PROVIDER === "twilio" &&
      !(e.TWILIO_ACCOUNT_SID && e.TWILIO_AUTH_TOKEN && e.TWILIO_FROM)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "SMS_PROVIDER=twilio requiert TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_FROM (numéro E.164 ou Messaging Service SID).",
      });
    }

    // B5 — stockage S3 : configuration complète exigée.
    if (
      storageS3 &&
      !(e.S3_ENDPOINT && e.S3_BUCKET && e.S3_ACCESS_KEY_ID && e.S3_SECRET_ACCESS_KEY)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "STORAGE_MODE=s3 requiert S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID et S3_SECRET_ACCESS_KEY.",
      });
    }

    // PR4 — WhatsApp : tokens Meta obligatoires si OTP_PROVIDER=meta-whatsapp.
    const hasWaToken = Boolean(e.META_WHATSAPP_ACCESS_TOKEN || e.META_WABA_TOKEN);
    const hasWaPhoneId = Boolean(e.META_WHATSAPP_PHONE_ID || e.META_WABA_PHONE_NUMBER_ID);
    if (e.OTP_PROVIDER === "meta-whatsapp" && !(hasWaToken && hasWaPhoneId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "OTP_PROVIDER=meta-whatsapp requiert un token (META_WHATSAPP_ACCESS_TOKEN ou META_WABA_TOKEN) et un phone id (META_WHATSAPP_PHONE_ID ou META_WABA_PHONE_NUMBER_ID).",
      });
    }

    // PR5 — Resend : clé API obligatoire si EMAIL_PROVIDER=resend.
    if (e.EMAIL_PROVIDER === "resend" && !e.RESEND_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "EMAIL_PROVIDER=resend requiert RESEND_API_KEY.",
      });
    }

    // CAPTCHA réel : les deux clés Turnstile sont exigées (sinon widget côté
    // client OU vérification serveur inopérants → fail-closed silencieux).
    if (
      e.CAPTCHA_MODE === "turnstile" &&
      !(e.TURNSTILE_SECRET_KEY && e.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "CAPTCHA_MODE=turnstile requiert TURNSTILE_SECRET_KEY et NEXT_PUBLIC_TURNSTILE_SITE_KEY.",
      });
    }

    // L4.2 — Sentry : les deux variables doivent être posées ENSEMBLE (même
    // valeur des deux côtés) — sinon Sentry actif côté serveur mais aveugle
    // côté client (ou l'inverse), silencieusement.
    if (Boolean(e.SENTRY_DSN) !== Boolean(e.NEXT_PUBLIC_SENTRY_DSN)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "SENTRY_DSN et NEXT_PUBLIC_SENTRY_DSN doivent être définis ensemble (ou aucun des deux), avec la même valeur.",
      });
    }

    // L3.1 — scheduler : secret obligatoire dès qu'un mode réel est actif
    // (sinon /api/jobs/tick tournerait à découvert en prod réelle).
    if (anyRealMode && !e.CRON_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Un mode réel actif (PAYMENT_MODE=konnect / KYC_MODE=production / STORAGE_MODE=s3) requiert CRON_SECRET (protège /api/jobs/tick).",
      });
    }

    // B1 — production RÉELLE (au moins un mode réel actif) : un proxy de confiance
    // est obligatoire, sinon le rate limiting par IP retombe sur un bucket global
    // « untrusted » (lockout de toute la plateforme / DoS trivial). Une DÉMO en
    // build prod (tous modes démo) n'est PAS bloquée — juste avertie plus bas.
    if (isProd && anyRealMode && e.TRUSTED_PROXY !== "true") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "En production réelle, TRUSTED_PROXY doit valoir \"true\" derrière un proxy de confiance (Cloudflare/Nginx/Vercel) qui réécrit l'en-tête d'IP — sinon le rate limiting est inopérant.",
      });
    }
  });

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

// ── Avertissements NON bloquants : préparent la prod sans casser la démo ──────
// On ne crashe jamais une démo (tous modes démo) lancée en build production ;
// on signale juste ce qui devra être activé avant un lancement public réel.
if (env.NODE_ENV === "production") {
  const allDemo =
    env.PAYMENT_MODE !== "konnect" &&
    env.KYC_MODE !== "production" &&
    env.STORAGE_MODE !== "s3" &&
    env.STORAGE_DRIVER !== "s3";
  if (allDemo) {
    console.warn(
      "[env] Build PRODUCTION en mode DÉMO (paiement simulé / KYC démo / stockage local). OK pour une démo ; activez PAYMENT_MODE, KYC_MODE, STORAGE_MODE avant tout lancement public réel."
    );
  }
  if (!env.REDIS_URL) {
    console.warn(
      "[env] REDIS_URL absent en production : rate limiting et cache restent in-memory (mono-instance UNIQUEMENT). Indispensable dès le multi-instance."
    );
  }
  if (env.TRUSTED_PROXY !== "true") {
    console.warn(
      "[env] TRUSTED_PROXY≠\"true\" en production : le rate limiting par IP est inopérant tant qu'un proxy de confiance n'est pas configuré."
    );
  }
}

// ── Log des modes opt-in actifs au boot (info, pas d'erreur) ──────────────────
console.info(
  "[env] modes opt-in :",
  JSON.stringify({
    KYC_GATING: env.KYC_GATING ?? "off",
    OTP_PROVIDER: env.OTP_PROVIDER ?? "sms",
    EMAIL_PROVIDER: env.EMAIL_PROVIDER ?? "demo",
  })
);
