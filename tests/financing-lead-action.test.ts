/**
 * MONETISATION_IMMO_ROADMAP.md §MI5 — apport d'affaires financement.
 * Capture du lead uniquement (aucune monétisation, bloquée tant qu'aucun
 * partenariat bancaire n'est signé) : VENTE seulement, annonce active,
 * rate-limitée, zod validé.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn() },
    financingLead: { create: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: {
      tropDeTentatives: "Trop de tentatives.",
      champsRequis: "Champs invalides.",
      erreurInconnue: "Erreur inconnue.",
    },
    financement: { envoye: "Demande enregistrée." },
  }),
}));

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { assertRateLimit } from "@/lib/rate-limit";
import { submitFinancingLeadAction } from "@/actions/financing-lead";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const leadCreate = prisma.financingLead.create as unknown as Mock;

const VENTE_ID = "cmrz1prop00000000000venteid";

function buildForm(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validFields = {
  propertyId: VENTE_ID,
  name: "Amira Ben Salah",
  email: "amira@example.com",
  phone: "+216 22 345 678",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(assertRateLimit).mockResolvedValue(true);
  vi.mocked(getSessionUser).mockResolvedValue(null);
  propertyFindUnique.mockResolvedValue({ id: VENTE_ID, type: "VENTE", status: "ACTIVE" });
  leadCreate.mockResolvedValue({});
});

describe("submitFinancingLeadAction", () => {
  it("crée un lead pour une annonce VENTE active", async () => {
    const result = await submitFinancingLeadAction(undefined, buildForm(validFields));

    expect(leadCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        propertyId: VENTE_ID,
        name: "Amira Ben Salah",
        email: "amira@example.com",
        phone: "+216 22 345 678",
        senderId: null,
        desiredAmount: null,
        message: null,
      }),
    });
    expect(result).toEqual({ success: "Demande enregistrée." });
  });

  it("résout senderId depuis la session si connecté", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({ id: "user-1" } as never);

    await submitFinancingLeadAction(undefined, buildForm(validFields));

    expect(leadCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ senderId: "user-1" }) })
    );
  });

  it("accepte un montant souhaité et un message optionnels", async () => {
    await submitFinancingLeadAction(
      undefined,
      buildForm({ ...validFields, desiredAmount: "150000", message: "Achat résidence principale" })
    );

    expect(leadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ desiredAmount: 150_000, message: "Achat résidence principale" }),
      })
    );
  });

  it("rejette une annonce LOCATION (financement = achat uniquement)", async () => {
    propertyFindUnique.mockResolvedValue({ id: VENTE_ID, type: "LOCATION", status: "ACTIVE" });

    const result = await submitFinancingLeadAction(undefined, buildForm(validFields));

    expect(leadCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Erreur inconnue." });
  });

  it("rejette une annonce SEJOUR", async () => {
    propertyFindUnique.mockResolvedValue({ id: VENTE_ID, type: "SEJOUR", status: "ACTIVE" });

    await submitFinancingLeadAction(undefined, buildForm(validFields));

    expect(leadCreate).not.toHaveBeenCalled();
  });

  it("rejette une annonce introuvable", async () => {
    propertyFindUnique.mockResolvedValue(null);

    const result = await submitFinancingLeadAction(undefined, buildForm(validFields));

    expect(leadCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Erreur inconnue." });
  });

  it("rejette une annonce VENTE non active", async () => {
    propertyFindUnique.mockResolvedValue({ id: VENTE_ID, type: "VENTE", status: "EN_ATTENTE_VALIDATION" });

    await submitFinancingLeadAction(undefined, buildForm(validFields));

    expect(leadCreate).not.toHaveBeenCalled();
  });

  it("rejette des champs invalides (email malformé)", async () => {
    const result = await submitFinancingLeadAction(
      undefined,
      buildForm({ ...validFields, email: "pas-un-email" })
    );

    expect(leadCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Champs invalides." });
  });

  it("respecte le rate limit", async () => {
    vi.mocked(assertRateLimit).mockResolvedValue(false);

    const result = await submitFinancingLeadAction(undefined, buildForm(validFields));

    expect(assertRateLimit).toHaveBeenCalledWith("financing-lead");
    expect(propertyFindUnique).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Trop de tentatives." });
  });
});
