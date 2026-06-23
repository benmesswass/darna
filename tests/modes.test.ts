/**
 * Tests — dérivation de kycMode() à partir du canal OTP.
 * Invariant : un canal réel (OTP_PROVIDER ≠ "sms") force le mode production,
 * pour ne jamais accorder un statut démo après un OTP réellement envoyé.
 */
import { afterEach, describe, expect, it } from "vitest";
import { kycMode, getOtpProvider } from "@/lib/modes";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("getOtpProvider", () => {
  it("défaut = sms quand OTP_PROVIDER absent", () => {
    delete process.env.OTP_PROVIDER;
    expect(getOtpProvider()).toBe("sms");
  });

  it("reconnaît meta-whatsapp", () => {
    process.env.OTP_PROVIDER = "meta-whatsapp";
    expect(getOtpProvider()).toBe("meta-whatsapp");
  });
});

describe("kycMode (dérivé du canal)", () => {
  it("démo par défaut (aucune config)", () => {
    delete process.env.KYC_MODE;
    delete process.env.OTP_PROVIDER;
    expect(kycMode()).toBe("demo");
  });

  it("canal sms sans KYC_MODE → démo", () => {
    delete process.env.KYC_MODE;
    process.env.OTP_PROVIDER = "sms";
    expect(kycMode()).toBe("demo");
  });

  it("canal réel meta-whatsapp → production même sans KYC_MODE", () => {
    delete process.env.KYC_MODE;
    process.env.OTP_PROVIDER = "meta-whatsapp";
    expect(kycMode()).toBe("production");
  });

  it("KYC_MODE=production force production (rétro-compat, canal sms)", () => {
    process.env.KYC_MODE = "production";
    process.env.OTP_PROVIDER = "sms";
    expect(kycMode()).toBe("production");
  });
});
