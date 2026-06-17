import { afterEach, describe, expect, it } from "vitest";

import { decryptSensitive, encryptSensitive, hashOtp } from "@/lib/crypto";

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
});
