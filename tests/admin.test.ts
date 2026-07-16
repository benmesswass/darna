/**
 * Tests PR1 — verifyPropertyAction / unverifyPropertyAction
 * Tests PR2 — reviewWakilApplicationAction
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
    wakilApplication: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/session", () => ({
  requireAdmin: vi.fn(),
  requireWakilOrAdmin: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
  clientIp: vi.fn().mockResolvedValue("127.0.0.1"),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    admin: {
      annonceMiseAVerifiee: "Annonce vérifiée.",
      annonceMiseANonVerifiee: "Badge retiré.",
      proprietaireNonVerifie: "Propriétaire non vérifié.",
      candidatureRevue: "Candidature revue.",
      limiteAbonnementAtteinte: (limite: number) => `Limite atteinte (${limite}).`,
    },
    common: {
      champsRequis: "Champs requis.",
      erreurInconnue: "Erreur inconnue.",
    },
  }),
}));

import { verifyPropertyAction, unverifyPropertyAction, reviewWakilApplicationAction } from "@/actions/admin";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireWakilOrAdmin } from "@/lib/session";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const propertyUpdate = prisma.property.update as unknown as Mock;
const propertyCount = prisma.property.count as unknown as Mock;
const subscriptionFindUnique = prisma.subscription.findUnique as unknown as Mock;
const wakilFindUnique = prisma.wakilApplication.findUnique as unknown as Mock;
const wakilUpdate = prisma.wakilApplication.update as unknown as Mock;
const userUpdate = prisma.user.update as unknown as Mock;

const mockAdmin = { id: "cldmin00000000000000000001", role: "ADMIN", isWakil: false };
const mockWakil = { id: "clwakil0000000000000000001", role: "HOTE", isWakil: true };

// Valid cuid-format IDs (cuid v1: starts with 'c' + 7+ alphanum)
const PROP_ID = "clprpty0000000000000000001";
const PROP_ID_2 = "clprpty0000000000000000002";
const APP_ID = "clapp000000000000000000001";
const APP_ID_2 = "clapp000000000000000000002";
const APP_ID_3 = "clapp000000000000000000003";

beforeEach(() => {
  vi.clearAllMocks();
  propertyUpdate.mockResolvedValue({});
  wakilUpdate.mockResolvedValue({});
  userUpdate.mockResolvedValue({});
});

// ── PR1 : verifyPropertyAction ────────────────────────────────────────────────

describe("verifyPropertyAction", () => {
  it("vérifie une annonce si le propriétaire est VERIFIE", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      verified: false,
      ownerId: "clowner00000000000000000001",
      owner: { kycStatus: "VERIFIE" },
    });

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    fd.set("verificationLevel", "REMOTE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.success).toBeDefined();
    expect(propertyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PROP_ID },
        data: expect.objectContaining({ verified: true }),
      })
    );
  });

  it("vérifie une annonce si le propriétaire est DEMO_VERIFIE (wakil)", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockWakil);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID_2,
      verified: false,
      ownerId: "clowner00000000000000000002",
      owner: { kycStatus: "DEMO_VERIFIE" },
    });

    const fd = new FormData();
    fd.set("propertyId", PROP_ID_2);
    fd.set("verificationLevel", "ON_SITE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.success).toBeDefined();
  });

  it("refuse si le propriétaire n'est pas vérifié (NON_VERIFIE)", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      verified: false,
      ownerId: "clowner00000000000000000003",
      owner: { kycStatus: "NON_VERIFIE" },
    });

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.error).toBeDefined();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("refuse si le compte agence a atteint sa limite d'annonces actives (palier gratuit, MONETISATION_IMMO_ROADMAP.md §MI2)", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      verified: false,
      ownerId: "clowner00000000000000000004",
      owner: { kycStatus: "VERIFIE", role: "AGENCE" },
    });
    subscriptionFindUnique.mockResolvedValue(null); // pas d'abonnement → palier gratuit (3)
    propertyCount.mockResolvedValue(3); // déjà à la limite

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    fd.set("verificationLevel", "REMOTE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.error).toBeDefined();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("autorise un compte agence qui n'a pas encore atteint sa limite d'annonces actives", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      verified: false,
      ownerId: "clowner00000000000000000005",
      owner: { kycStatus: "VERIFIE", role: "AGENCE" },
    });
    subscriptionFindUnique.mockResolvedValue(null);
    propertyCount.mockResolvedValue(1); // sous la limite gratuite (3)

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    fd.set("verificationLevel", "REMOTE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.success).toBeDefined();
    expect(propertyUpdate).toHaveBeenCalled();
  });

  it("ignore la limite d'abonnement pour un compte HOTE (le mécanisme ne cible que les agences)", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      verified: false,
      ownerId: "clowner00000000000000000006",
      owner: { kycStatus: "VERIFIE", role: "HOTE" },
    });

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    fd.set("verificationLevel", "REMOTE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.success).toBeDefined();
    expect(propertyCount).not.toHaveBeenCalled();
    expect(subscriptionFindUnique).not.toHaveBeenCalled();
  });

  it("refuse si le propertyId est invalide (non-cuid)", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    const fd = new FormData();
    fd.set("propertyId", "not-a-cuid");
    const result = await verifyPropertyAction(undefined, fd);
    expect(result?.error).toBeDefined();
    expect(propertyFindUnique).not.toHaveBeenCalled();
  });

  it("retourne erreur si l'annonce n'existe pas en base", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue(null);

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    const result = await verifyPropertyAction(undefined, fd);
    expect(result?.error).toBeDefined();
  });
});

// ── PR1 : unverifyPropertyAction ──────────────────────────────────────────────

describe("unverifyPropertyAction", () => {
  it("retire le badge de vérification", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({ id: PROP_ID, ownerId: "clowner00000000000000000001" });

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    const result = await unverifyPropertyAction(undefined, fd);

    expect(result?.success).toBeDefined();
    expect(propertyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ verified: false, verifiedAt: null, verifiedById: null }),
      })
    );
  });
});

// ── PR2 : reviewWakilApplicationAction ───────────────────────────────────────

describe("reviewWakilApplicationAction", () => {
  it("promeut l'utilisateur si ACCEPTEE avec userId", async () => {
    (requireAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    wakilFindUnique.mockResolvedValue({
      id: APP_ID,
      status: "RECUE",
      userId: "cluser00000000000000000123",
      email: "candidat@test.tn",
    });

    const fd = new FormData();
    fd.set("applicationId", APP_ID);
    fd.set("decision", "ACCEPTEE");
    const result = await reviewWakilApplicationAction(undefined, fd);

    expect(result?.success).toBeDefined();
    expect(wakilUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "ACCEPTEE" }) })
    );
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cluser00000000000000000123" },
        data: { isWakil: true },
      })
    );
  });

  it("n'essaie pas de promouvoir si userId est null", async () => {
    (requireAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    wakilFindUnique.mockResolvedValue({
      id: APP_ID_2,
      status: "RECUE",
      userId: null,
      email: "anonyme@test.tn",
    });

    const fd = new FormData();
    fd.set("applicationId", APP_ID_2);
    fd.set("decision", "ACCEPTEE");
    await reviewWakilApplicationAction(undefined, fd);

    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("met à jour le statut REFUSEE sans promouvoir", async () => {
    (requireAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    wakilFindUnique.mockResolvedValue({
      id: APP_ID_3,
      status: "RECUE",
      userId: "cluser00000000000000000456",
      email: "test@test.tn",
    });

    const fd = new FormData();
    fd.set("applicationId", APP_ID_3);
    fd.set("decision", "REFUSEE");
    const result = await reviewWakilApplicationAction(undefined, fd);

    expect(result?.success).toBeDefined();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("refuse une décision invalide", async () => {
    (requireAdmin as unknown as Mock).mockResolvedValue(mockAdmin);

    const fd = new FormData();
    fd.set("applicationId", APP_ID);
    fd.set("decision", "INVALIDE");
    const result = await reviewWakilApplicationAction(undefined, fd);

    expect(result?.error).toBeDefined();
    expect(wakilFindUnique).not.toHaveBeenCalled();
  });
});
