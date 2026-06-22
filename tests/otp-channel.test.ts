/**
 * Tests PR4 — otp-channel.ts (fonctions pures + aiguillage)
 */
import { describe, expect, it } from "vitest";
import {
  buildAuthHeader,
  buildMetaTemplateBody,
  maskEmail,
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
