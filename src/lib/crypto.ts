import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Chiffrement au repos des données sensibles (CIN) + hachage d'OTP.
 * Module SERVEUR uniquement.
 *
 * Chiffrement OPT-IN : si `KYC_ENC_KEY` est défini, AES-256-GCM ; sinon
 * passthrough (clair) → comportement actuel, démo inchangée. La clé (n'importe
 * quel secret, ex. `openssl rand -hex 32`) est dérivée en 32 octets par SHA-256.
 */
const PREFIX = "enc:v1:";

function key32(): Buffer | null {
  const k = process.env.KYC_ENC_KEY;
  if (!k) return null;
  return createHash("sha256").update(k).digest(); // 32 octets déterministes
}

/**
 * Vrai si le chiffrement au repos est actif (KYC_ENC_KEY présent). En
 * KYC_MODE=production, src/lib/env.ts garantit que c'est TOUJOURS le cas (boot
 * fail-fast) → impossible de stocker une CIN en clair en production.
 */
export function isEncryptionEnabled(): boolean {
  return Boolean(process.env.KYC_ENC_KEY);
}

/**
 * Helper de MIGRATION (backfill) — à exécuter UNE fois, hors chemin chaud, le
 * jour où KYC_ENC_KEY est introduit pour chiffrer les CIN historiquement en
 * clair. Idempotent : une valeur déjà chiffrée (préfixe `enc:`) est renvoyée
 * telle quelle. Exemple de script :
 *
 *   // scripts/backfill-cin.ts  (npx tsx scripts/backfill-cin.ts)
 *   for (const u of await prisma.user.findMany({ where: { cin: { not: null } } }))
 *     await prisma.user.update({ where: { id: u.id }, data: { cin: ensureEncrypted(u.cin!) } });
 */
export function ensureEncrypted(stored: string): string {
  if (stored.startsWith(PREFIX)) return stored; // déjà chiffré → no-op
  return encryptSensitive(stored);
}

/** Chiffre une valeur sensible. Sans clé : renvoie la valeur en clair. */
export function encryptSensitive(plain: string): string {
  const key = key32();
  if (!key) return plain;

  const iv = randomBytes(12);
  // `authTagLength` figé à 16 octets (déjà la valeur réelle générée) : empêche
  // qu'un tag tronqué soit accepté au déchiffrement si la donnée stockée était
  // un jour altérée (Semgrep gcm-no-tag-length).
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

/**
 * Déchiffre une valeur. Une valeur non préfixée (legacy en clair, ou stockée
 * sans clé) est renvoyée telle quelle → compatible avec les données existantes.
 */
export function decryptSensitive(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;

  const key = key32();
  if (!key) {
    throw new Error("KYC_ENC_KEY requise pour déchiffrer une valeur chiffrée");
  }
  const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split(":");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"), {
    authTagLength: 16,
  });
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** Hache un OTP (avec poivre AUTH_SECRET) — jamais stocké en clair. */
export function hashOtp(code: string): string {
  return createHash("sha256")
    .update(`${code}:${process.env.AUTH_SECRET ?? "darna"}`)
    .digest("hex");
}

/**
 * Hache un jeton de réinitialisation de mot de passe (avec poivre AUTH_SECRET)
 * — seul le hash est stocké, jamais le jeton en clair. Le jeton est aléatoire
 * (32 octets), donc un simple SHA-256 poivré suffit (pas de force brute
 * possible sur l'espace des jetons). Cf. src/lib/reset-token.ts.
 */
export function hashResetToken(token: string): string {
  return createHash("sha256")
    .update(`reset:${token}:${process.env.AUTH_SECRET ?? "darna"}`)
    .digest("hex");
}

/**
 * Empreinte DÉTERMINISTE d'une CIN — sert l'index unique `User.cinHash` pour
 * empêcher deux comptes de partager le même numéro, sans jamais stocker la CIN
 * en clair dans l'index. Déterministe (contrairement au chiffrement AES-GCM
 * randomisé) : même CIN ⇒ même hash. Poivré par KYC_ENC_KEY (ou AUTH_SECRET en
 * démo). La CIN est normalisée (chiffres uniquement) avant hachage.
 */
export function hashCin(cin: string): string {
  const normalized = cin.replace(/\D/g, "");
  const pepper = process.env.KYC_ENC_KEY ?? process.env.AUTH_SECRET ?? "darna";
  return createHash("sha256").update(`cin:${normalized}:${pepper}`).digest("hex");
}
