/**
 * Tests PR5 — mailer.ts (fonctions pures)
 */
import { describe, expect, it } from "vitest";
import { buildAuthHeader, buildResendPayload, maskEmail, getEmailProvider } from "@/lib/mailer";

describe("buildAuthHeader", () => {
  it("construit les en-têtes Bearer Resend corrects", () => {
    const headers = buildAuthHeader("re_testkey");
    expect(headers.Authorization).toBe("Bearer re_testkey");
    expect(headers["Content-Type"]).toBe("application/json");
  });
});

describe("buildResendPayload", () => {
  it("construit le payload JSON correct pour Resend", () => {
    const payload = buildResendPayload({
      to: "user@test.tn",
      subject: "Test",
      html: "<p>Bonjour</p>",
    });
    expect(payload.to).toEqual(["user@test.tn"]);
    expect(payload.subject).toBe("Test");
    expect(payload.html).toBe("<p>Bonjour</p>");
    // from doit être défini
    expect(typeof payload.from).toBe("string");
    expect((payload.from as string).length).toBeGreaterThan(0);
  });
});

describe("maskEmail", () => {
  it("masque les caractères internes", () => {
    const masked = maskEmail("leila@darna.tn");
    expect(masked).toMatch(/^l•+a@darna\.tn$/);
  });

  it("gère un email invalide", () => {
    expect(maskEmail("invalid")).toBe("•••@•••");
  });
});

describe("getEmailProvider", () => {
  it("retourne demo par défaut", () => {
    const original = process.env.EMAIL_PROVIDER;
    delete process.env.EMAIL_PROVIDER;
    expect(getEmailProvider()).toBe("demo");
    if (original !== undefined) process.env.EMAIL_PROVIDER = original;
  });

  it("retourne resend si EMAIL_PROVIDER=resend", () => {
    process.env.EMAIL_PROVIDER = "resend";
    expect(getEmailProvider()).toBe("resend");
    delete process.env.EMAIL_PROVIDER;
  });
});
