import { afterEach, describe, expect, it } from "vitest";

import {
  decryptSensitive,
  encryptSensitive,
  ensureEncrypted,
  hashCin,
  hashOtp,
  hashResetToken,
  isEncryptionEnabled,
} from "@/lib/crypto";

describe("crypto — CIN au repos + hash OTP", () => {
  afterEach(() => {
    delete process.env.KYC_ENC_KEY;
  });

  it("sans KYC_ENC_KEY : passthrough en clair (compat données existantes)", () => {
    delete process.env.KYC_ENC_KEY;
    expect(encryptSensitive("12345678")).toBe("12345678");
    expect(decryptSensitive("12345678")).toBe("12345678");
  });

  it("avec clé : round-trip chiffrement et ciphertext ≠ clair", () => {
    process.env.KYC_ENC_KEY = "0123456789abcdef0123456789abcdef";
    const enc = encryptSensitive("12345678");
    expect(enc).not.toBe("12345678");
    expect(enc.startsWith("enc:v1:")).toBe(true);
    expect(decryptSensitive(enc)).toBe("12345678");
  });

  it("déchiffre une valeur legacy en clair même avec une clé définie", () => {
    process.env.KYC_ENC_KEY = "0123456789abcdef0123456789abcdef";
    expect(decryptSensitive("87654321")).toBe("87654321");
  });

  it("hashOtp est déterministe et ne révèle pas le code", () => {
    expect(hashOtp("123456")).toBe(hashOtp("123456"));
    expect(hashOtp("123456")).not.toContain("123456");
    expect(hashOtp("123456")).not.toBe(hashOtp("654321"));
  });

  it("hashCin est déterministe, normalise et ne révèle pas la CIN", () => {
    // Même CIN ⇒ même hash (clé de l'unicité inter-comptes).
    expect(hashCin("08123456")).toBe(hashCin("08123456"));
    // Normalisation : espaces/ponctuation ignorés.
    expect(hashCin("08 12 34 56")).toBe(hashCin("08123456"));
    // CIN différentes ⇒ hash différents ; le numéro n'apparaît jamais en clair.
    expect(hashCin("08123456")).not.toBe(hashCin("00112233"));
    expect(hashCin("08123456")).not.toContain("08123456");
  });

  it("hashResetToken est déterministe et ne révèle pas le jeton (P2.10)", () => {
    expect(hashResetToken("tok-abc")).toBe(hashResetToken("tok-abc"));
    expect(hashResetToken("tok-abc")).not.toContain("tok-abc");
    expect(hashResetToken("tok-abc")).not.toBe(hashResetToken("tok-def"));
    // Poivré différemment de hashOtp (préfixe "reset:") : jamais la même sortie.
    expect(hashResetToken("tok-abc")).not.toBe(hashOtp("tok-abc"));
  });

  it("isEncryptionEnabled reflète la présence de KYC_ENC_KEY (P2.10)", () => {
    delete process.env.KYC_ENC_KEY;
    expect(isEncryptionEnabled()).toBe(false);

    process.env.KYC_ENC_KEY = "0123456789abcdef0123456789abcdef";
    expect(isEncryptionEnabled()).toBe(true);
  });

  it("ensureEncrypted chiffre une valeur en clair et est idempotente (P2.10)", () => {
    process.env.KYC_ENC_KEY = "0123456789abcdef0123456789abcdef";

    const enc = ensureEncrypted("12345678");
    expect(enc.startsWith("enc:v1:")).toBe(true);
    expect(decryptSensitive(enc)).toBe("12345678");

    // Déjà chiffrée : renvoyée telle quelle (pas de double chiffrement).
    expect(ensureEncrypted(enc)).toBe(enc);
  });

  it("decryptSensitive lève sans KYC_ENC_KEY sur une valeur chiffrée (P2.10)", () => {
    process.env.KYC_ENC_KEY = "0123456789abcdef0123456789abcdef";
    const enc = encryptSensitive("12345678");
    delete process.env.KYC_ENC_KEY;

    expect(() => decryptSensitive(enc)).toThrow();
  });
});
