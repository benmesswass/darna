/**
 * Tests PR4 — otp-channel.ts (fonctions pures + aiguillage)
 */
import { describe, expect, it } from "vitest";
import {
  buildAuthHeader,
  buildMetaTemplateBody,
  composeE164,
  maskEmail,
  toWhatsAppNumber,
} from "@/lib/otp-channel";

describe("buildAuthHeader", () => {
  it("construit les en-têtes Bearer corrects", () => {
    const headers = buildAuthHeader("my-token");
    expect(headers.Authorization).toBe("Bearer my-token");
    expect(headers["Content-Type"]).toBe("application/json");
  });
});

describe("buildMetaTemplateBody", () => {
  it("construit le bon corps JSON pour l'API WhatsApp", () => {
    const body = buildMetaTemplateBody("+21622111222", "123456");
    expect(body.messaging_product).toBe("whatsapp");
    expect(body.to).toBe("+21622111222");
    expect(body.type).toBe("template");
    // Le corps doit contenir le code dans les paramètres
    const template = body.template as Record<string, unknown>;
    const components = template.components as Array<Record<string, unknown>>;
    const bodyComp = components.find((c) => c.type === "body");
    expect(bodyComp).toBeDefined();
    const params = bodyComp!.parameters as Array<Record<string, unknown>>;
    expect(params[0].text).toBe("123456");
  });

  it("utilise les défauts authentication/fr sans surcharge", () => {
    const body = buildMetaTemplateBody("+21622111222", "123456");
    const template = body.template as Record<string, unknown>;
    expect(template.name).toBe("authentication");
    expect(template.language).toEqual({ code: "fr" });
  });

  it("respecte un template name/lang personnalisé", () => {
    const body = buildMetaTemplateBody("+21622111222", "123456", "darna_otp", "en");
    const template = body.template as Record<string, unknown>;
    expect(template.name).toBe("darna_otp");
    expect(template.language).toEqual({ code: "en" });
  });
});

describe("toWhatsAppNumber", () => {
  it("retire le + et les espaces (format international)", () => {
    expect(toWhatsAppNumber("+216 22 345 678")).toBe("21622345678");
    expect(toWhatsAppNumber("+33 6 12 44 87 03")).toBe("33612448703");
  });

  it("retire le préfixe international 00", () => {
    expect(toWhatsAppNumber("0033650031666")).toBe("33650031666");
  });

  it("retire tirets et parenthèses", () => {
    expect(toWhatsAppNumber("+216-22-345-678")).toBe("21622345678");
  });

  it("laisse un numéro déjà propre inchangé", () => {
    expect(toWhatsAppNumber("21622345678")).toBe("21622345678");
  });
});

describe("composeE164", () => {
  it("compose indicatif + national en retirant le 0 de tête", () => {
    expect(composeE164("33", "06 50 03 16 66")).toBe("+33650031666");
    expect(composeE164("216", "22 345 678")).toBe("+21622345678");
  });

  it("ignore un + dans l'indicatif et les séparateurs du national", () => {
    expect(composeE164("+33", "06-50-03-16-66")).toBe("+33650031666");
  });

  it("gère un national déjà sans 0 de tête", () => {
    expect(composeE164("216", "22345678")).toBe("+21622345678");
  });
});

describe("maskEmail", () => {
  it("masque les caractères internes de l'email", () => {
    const masked = maskEmail("test@darna.tn");
    expect(masked).toMatch(/^t•+t@darna\.tn$/);
    expect(masked).not.toContain("es");
  });

  it("gère un email très court", () => {
    const masked = maskEmail("ab@x.tn");
    expect(masked).toContain("@x.tn");
  });

  it("gère un format invalide", () => {
    expect(maskEmail("noatsign")).toBe("•••@•••");
  });
});
