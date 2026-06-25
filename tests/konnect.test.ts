import { describe, expect, it } from "vitest";

import {
  tndToMillimes,
  signKonnectWebhook,
  verifyKonnectWebhook,
} from "@/lib/konnect";

// Le montant débité par Konnect est TOUJOURS en millimes (1 TND = 1000 millimes).
// Une erreur ici facturerait l'acheteur ×1000 ou ÷1000 → test de non-régression.
describe("tndToMillimes", () => {
  it("convertit les dinars en millimes (×1000)", () => {
    expect(tndToMillimes(1)).toBe(1000);
    expect(tndToMillimes(120)).toBe(120_000);
  });

  it("arrondit au millime le plus proche", () => {
    expect(tndToMillimes(1.2345)).toBe(1235);
    expect(tndToMillimes(0.0004)).toBe(0);
  });

  it("gère le montant nul", () => {
    expect(tndToMillimes(0)).toBe(0);
  });
});

// Signature du webhook Konnect : c'est la garde d'authenticité (Konnect ne
// signe pas ses appels). Une régression ici rouvrirait la porte au forge d'un
// règlement à partir d'un payment_ref deviné → tests de non-régression sécurité.
describe("signKonnectWebhook / verifyKonnectWebhook", () => {
  it("valide une signature qu'elle vient de produire (aller-retour)", () => {
    const sig = signKonnectWebhook("bk_123");
    expect(verifyKonnectWebhook("bk_123", sig)).toBe(true);
  });

  it("produit une signature URL-safe (base64url : pas de +, / ni =)", () => {
    const sig = signKonnectWebhook("bk_123");
    expect(sig).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("rejette une signature falsifiée", () => {
    const sig = signKonnectWebhook("bk_123");
    expect(verifyKonnectWebhook("bk_123", `${sig}x`)).toBe(false);
    expect(verifyKonnectWebhook("bk_123", sig.slice(0, -1))).toBe(false);
  });

  it("rejette la signature d'une AUTRE réservation (liaison à l'id)", () => {
    const sig = signKonnectWebhook("bk_123");
    expect(verifyKonnectWebhook("bk_999", sig)).toBe(false);
  });

  it("rejette les entrées vides", () => {
    expect(verifyKonnectWebhook("", "")).toBe(false);
    expect(verifyKonnectWebhook("bk_123", "")).toBe(false);
    expect(verifyKonnectWebhook("", signKonnectWebhook("bk_123"))).toBe(false);
  });

  it("est déterministe pour un même id", () => {
    expect(signKonnectWebhook("bk_123")).toBe(signKonnectWebhook("bk_123"));
  });
});
