/**
 * Tests — atterrissage par défaut après connexion : page de vérification si le
 * compte n'est pas complet, accueil sinon. CIN exigée en plus pour les
 * annonceurs (hôte / agence).
 */
import { describe, expect, it } from "vitest";
import { defaultLandingPath } from "@/lib/redirect";

const VERIF = "/dashboard/verifications";
const HOME = "/";

describe("defaultLandingPath", () => {
  it("voyageur vérifié (e-mail + téléphone) → accueil", () => {
    expect(
      defaultLandingPath({
        role: "VOYAGEUR",
        emailVerified: true,
        phoneVerified: true,
        kycStatus: "NON_VERIFIE",
      })
    ).toBe(HOME);
  });

  it("voyageur sans téléphone vérifié → vérification", () => {
    expect(
      defaultLandingPath({
        role: "VOYAGEUR",
        emailVerified: true,
        phoneVerified: false,
        kycStatus: "NON_VERIFIE",
      })
    ).toBe(VERIF);
  });

  it("voyageur sans e-mail vérifié → vérification", () => {
    expect(
      defaultLandingPath({
        role: "VOYAGEUR",
        emailVerified: false,
        phoneVerified: true,
        kycStatus: "VERIFIE",
      })
    ).toBe(VERIF);
  });

  it("hôte e-mail+téléphone OK mais KYC non vérifié → vérification (CIN requise)", () => {
    expect(
      defaultLandingPath({
        role: "HOTE",
        emailVerified: true,
        phoneVerified: true,
        kycStatus: "NON_VERIFIE",
      })
    ).toBe(VERIF);
  });

  it("hôte entièrement vérifié (KYC VERIFIE) → accueil", () => {
    expect(
      defaultLandingPath({
        role: "HOTE",
        emailVerified: true,
        phoneVerified: true,
        kycStatus: "VERIFIE",
      })
    ).toBe(HOME);
  });

  it("hôte vérifié en démo (DEMO_VERIFIE) → accueil", () => {
    expect(
      defaultLandingPath({
        role: "AGENCE",
        emailVerified: true,
        phoneVerified: true,
        kycStatus: "DEMO_VERIFIE",
      })
    ).toBe(HOME);
  });
});
