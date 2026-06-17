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

/** Chiffre une valeur sensible. Sans clé : renvoie la valeur en clair. */
export function encryptSensitive(plain: string): string {
  const key = key32();
  if (!key) return plain;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
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
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
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
