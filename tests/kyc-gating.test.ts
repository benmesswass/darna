/**
 * Tests PR3 — kycGatingEnabled() + intégration createPropertyAction
 */
import { describe, expect, it } from "vitest";
import { kycGatingEnabled } from "@/lib/modes";

describe("kycGatingEnabled", () => {
  it("retourne false par défaut (env non posée)", () => {
    const original = process.env.KYC_GATING;
    delete process.env.KYC_GATING;
    expect(kycGatingEnabled()).toBe(false);
    if (original !== undefined) process.env.KYC_GATING = original;
  });

  it("retourne true si KYC_GATING=on", () => {
    process.env.KYC_GATING = "on";
    expect(kycGatingEnabled()).toBe(true);
    delete process.env.KYC_GATING;
  });

  it("retourne false si KYC_GATING=off", () => {
    process.env.KYC_GATING = "off";
    expect(kycGatingEnabled()).toBe(false);
    delete process.env.KYC_GATING;
  });

  it("retourne false pour toute valeur différente de 'on'", () => {
    process.env.KYC_GATING = "yes";
    expect(kycGatingEnabled()).toBe(false);
    delete process.env.KYC_GATING;
  });
});
