/**
 * P2.9 (ROADMAP.md) — fuzzing de blockDatesAction et updatePropertyAction
 * (src/actions/properties.ts) : champ requis manquant, structure imbriquée
 * injectée dans un champ scalaire, chaîne surdimensionnée, tableau
 * (`amenities`) invalide/surdimensionné. Rejet générique attendu, avant
 * toute écriture.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn(), update: vi.fn() },
    booking: { findFirst: vi.fn() },
    availability: { create: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ requireLister: vi.fn(), requireUser: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { champsRequis: "Champs requis.", erreurInconnue: "Erreur inconnue." },
    annonceForm: {
      blocageDatesInvalides: "Dates invalides.",
      blocageConflitReservation: "Conflit de réservation.",
      blocageAjoute: "Blocage ajouté.",
    },
  }),
}));

import { blockDatesAction, updatePropertyAction } from "@/actions/properties";
import { prisma } from "@/lib/prisma";
import { requireLister, requireUser } from "@/lib/session";

function fd(fields: Record<string, string[] | string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) for (const item of v) f.append(k, item);
    else f.set(k, v);
  }
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  (requireLister as unknown as Mock).mockResolvedValue({ id: "host-1" });
  (requireUser as unknown as Mock).mockResolvedValue({ id: "host-1" });
});

describe("blockDatesAction — fuzzing (P2.9)", () => {
  it("rejette un propertyId manquant, sans toucher la base", async () => {
    const res = await blockDatesAction(undefined, fd({ start: "2026-08-01", end: "2026-08-05" }));

    expect(res).toEqual({ error: "Dates invalides." });
    expect(prisma.availability.create).not.toHaveBeenCalled();
  });

  it("rejette une date malformée (JSON imbriqué injecté à la place d'une date), sans écriture", async () => {
    const nested = JSON.stringify({ $ne: null });

    const res = await blockDatesAction(
      undefined,
      fd({ propertyId: "clproperty000000000000001", start: nested, end: "2026-08-05" })
    );

    expect(res).toEqual({ error: "Dates invalides." });
    expect(prisma.availability.create).not.toHaveBeenCalled();
  });

  it("rejette une note privée (reason) démesurément longue (> 120), sans écriture", async () => {
    const huge = "x".repeat(5000);

    const res = await blockDatesAction(
      undefined,
      fd({
        propertyId: "clproperty000000000000001",
        start: "2026-08-01",
        end: "2026-08-05",
        reason: huge,
      })
    );

    expect(res).toEqual({ error: "Dates invalides." });
    expect(prisma.availability.create).not.toHaveBeenCalled();
  });
});

describe("updatePropertyAction — fuzzing du tableau amenities (P2.9)", () => {
  // Payload par ailleurs valide (cf. contraintes updateSchema dans
  // src/actions/properties.ts) pour isoler la validation du tableau amenities.
  function validFormData(amenities: string[]): FormData {
    return fd({
      propertyId: "clproperty000000000000001",
      title: "Villa de test avec jardin",
      price: "300",
      city: "Hammamet",
      latitude: "36.4",
      longitude: "10.6",
      description:
        "Une description suffisamment longue pour passer la validation zod du formulaire.",
      amenities,
    });
  }

  it("rejette une valeur d'équipement hors énumération (payload invalide), sans écriture", async () => {
    const res = await updatePropertyAction(undefined, validFormData(["Wifi", "TéléporteurQuantique"]));

    expect(res).toEqual({ error: "Champs requis." });
    expect(prisma.property.update).not.toHaveBeenCalled();
  });

  it("rejette un tableau amenities surdimensionné (plus d'entrées que l'énumération complète), sans écriture", async () => {
    // 20 doublons valides : dépasse .max(AMENITIES.length) même si chaque
    // valeur individuelle est légale.
    const oversized = Array.from({ length: 20 }, () => "Wifi");

    const res = await updatePropertyAction(undefined, validFormData(oversized));

    expect(res).toEqual({ error: "Champs requis." });
    expect(prisma.property.update).not.toHaveBeenCalled();
  });

  it("rejette un titre manquant, sans écriture", async () => {
    const f = validFormData(["Wifi"]);
    f.delete("title");

    const res = await updatePropertyAction(undefined, f);

    expect(res).toEqual({ error: "Champs requis." });
    expect(prisma.property.update).not.toHaveBeenCalled();
  });
});
