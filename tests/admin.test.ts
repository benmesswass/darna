/**
 * Tests PR1 — verifyPropertyAction / unverifyPropertyAction
 * Tests PR2 — reviewWakilApplicationAction
 */
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

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
    verificationWallet: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
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

vi.mock("@/lib/notification-center", () => ({
  notifyHostInvoiceReminder: vi.fn(),
  notifyAgencyQuotaReached: vi.fn(),
  notifyAgencyOutOfVerificationCredits: vi.fn(),
  notifyHostVerificationPaymentRequired: vi.fn(),
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
      creditsVerificationEpuises: "Crédits de vérification épuisés.",
      hostVerificationPaiementRequis: "Paiement de vérification requis.",
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
import {
  notifyAgencyQuotaReached,
  notifyAgencyOutOfVerificationCredits,
  notifyHostVerificationPaymentRequired,
} from "@/lib/notification-center";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const propertyUpdate = prisma.property.update as unknown as Mock;
const propertyCount = prisma.property.count as unknown as Mock;
const subscriptionFindUnique = prisma.subscription.findUnique as unknown as Mock;
const walletUpsert = prisma.verificationWallet.upsert as unknown as Mock;
const walletUpdateMany = prisma.verificationWallet.updateMany as unknown as Mock;
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
  // Défaut : crédit de vérification disponible (MI3) — les tests dédiés à
  // l'épuisement du solde écrasent explicitement ce mock.
  walletUpsert.mockResolvedValue({});
  walletUpdateMany.mockResolvedValue({ count: 1 });
});

// ── PR1 : verifyPropertyAction ────────────────────────────────────────────────

describe("verifyPropertyAction", () => {
  // P6.2 (ROADMAP.md) : le quota AGENCE et la consommation de crédit ne
  // s'appliquent que si le flag est actif — ce describe teste l'ENFORCEMENT
  // (§MI2/§MI3, opt-in), donc l'active explicitement. Le bypass avant
  // lancement a ses propres tests dédiés en fin de bloc.
  beforeEach(() => vi.stubEnv("GROWTH_MONETIZATION_ENABLED", "true"));
  afterEach(() => vi.unstubAllEnvs());

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

  it("refuse si le compte agence a atteint sa limite d'annonces actives (palier gratuit, MONETISATION_IMMO_ROADMAP.md §MI2) et notifie l'agence", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      title: "Appartement S+2 vue mer",
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
    // L'agence n'a aucun autre moyen de le découvrir que cette notification.
    expect(notifyAgencyQuotaReached).toHaveBeenCalledWith(
      "clowner00000000000000000004",
      "Appartement S+2 vue mer"
    );
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
    expect(notifyAgencyQuotaReached).not.toHaveBeenCalled();
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
    // Le quota d'annonces (MI2) ignore bien un compte HOTE — mais la
    // consommation de crédit de vérification (MI3bis), elle, s'applique
    // désormais À TOUS les rôles (cf. bloc de tests MI3bis ci-dessous).
    expect(propertyCount).not.toHaveBeenCalled();
    expect(subscriptionFindUnique).not.toHaveBeenCalled();
    expect(notifyAgencyQuotaReached).not.toHaveBeenCalled();
  });

  // ── MI3 : crédits de vérification Wakil ─────────────────────────────────────

  it("refuse si le compte agence n'a plus de crédit de vérification (MONETISATION_IMMO_ROADMAP.md §MI3) et notifie l'agence", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      title: "Studio Sousse",
      verified: false,
      ownerId: "clowner00000000000000000007",
      owner: { kycStatus: "VERIFIE", role: "AGENCE" },
    });
    subscriptionFindUnique.mockResolvedValue(null);
    propertyCount.mockResolvedValue(0); // largement sous le quota d'annonces
    walletUpdateMany.mockResolvedValue({ count: 0 }); // solde épuisé

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    fd.set("verificationLevel", "REMOTE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.error).toBeDefined();
    expect(propertyUpdate).not.toHaveBeenCalled();
    expect(notifyAgencyOutOfVerificationCredits).toHaveBeenCalledWith(
      "clowner00000000000000000007",
      "Studio Sousse"
    );
  });

  it("consomme un crédit et vérifie l'annonce quand le compte agence a un solde disponible", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      verified: false,
      ownerId: "clowner00000000000000000008",
      owner: { kycStatus: "VERIFIE", role: "AGENCE" },
    });
    subscriptionFindUnique.mockResolvedValue(null);
    propertyCount.mockResolvedValue(0);
    walletUpdateMany.mockResolvedValue({ count: 1 }); // crédit consommé avec succès

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    fd.set("verificationLevel", "REMOTE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.success).toBeDefined();
    expect(propertyUpdate).toHaveBeenCalled();
    expect(notifyAgencyOutOfVerificationCredits).not.toHaveBeenCalled();
  });

  // ── MI3bis (décision Wassim du 2026-07-20) : régime HOTE, différent de
  // l'agence — aucune vérification gratuite, paiement à l'unité obligatoire
  // AVANT. Le quota d'annonces (ci-dessus), lui, reste ignoré pour un HOTE.

  it("HOTE : refuse si aucun crédit payé (0 gratuit) et notifie — chemin DIFFÉRENT de l'agence", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      title: "Studio Sfax",
      verified: false,
      ownerId: "clowner00000000000000000009",
      owner: { kycStatus: "VERIFIE", role: "HOTE" },
    });
    walletUpdateMany.mockResolvedValue({ count: 0 }); // jamais payé

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    fd.set("verificationLevel", "REMOTE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.error).toBeDefined();
    expect(propertyUpdate).not.toHaveBeenCalled();
    // Ignore le quota d'annonces (réservé aux agences) mais bloque bien sur le crédit.
    expect(propertyCount).not.toHaveBeenCalled();
    expect(notifyHostVerificationPaymentRequired).toHaveBeenCalledWith(
      "clowner00000000000000000009",
      "Studio Sfax"
    );
    // La notification/erreur AGENCE ne doit jamais être déclenchée pour un HOTE.
    expect(notifyAgencyOutOfVerificationCredits).not.toHaveBeenCalled();
  });

  it("HOTE : consomme le crédit payé et vérifie l'annonce quand un paiement a déjà été réglé", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      verified: false,
      ownerId: "clowner00000000000000000010",
      owner: { kycStatus: "VERIFIE", role: "HOTE" },
    });
    walletUpdateMany.mockResolvedValue({ count: 1 }); // a payé au moins 1 vérification

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    fd.set("verificationLevel", "REMOTE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.success).toBeDefined();
    expect(propertyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ verificationCreditSpentAt: expect.any(Date) }),
      })
    );
    expect(notifyHostVerificationPaymentRequired).not.toHaveBeenCalled();
  });

  // ── Correction du 2026-07-20 : un crédit couvre l'annonce À VIE, jamais par
  // événement — une revérification (après retrait de badge OU republication
  // suite à expiration à LISTING_LIFETIME_DAYS jours) de la MÊME annonce ne
  // doit JAMAIS reconsommer de crédit, même à solde 0.

  it("AGENCE : une annonce déjà payée À VIE reste vérifiable même à solde 0 (republication après expiration)", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      verified: false,
      verificationCreditSpentAt: new Date("2026-06-01"), // déjà payée lors d'un cycle précédent
      ownerId: "clowner00000000000000000011",
      owner: { kycStatus: "VERIFIE", role: "AGENCE" },
    });
    subscriptionFindUnique.mockResolvedValue(null);
    propertyCount.mockResolvedValue(0);
    walletUpdateMany.mockResolvedValue({ count: 0 }); // solde à 0 : ne doit MÊME PAS être consulté

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    fd.set("verificationLevel", "REMOTE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.success).toBeDefined();
    expect(walletUpdateMany).not.toHaveBeenCalled(); // jamais interrogé : déjà payée à vie
    expect(notifyAgencyOutOfVerificationCredits).not.toHaveBeenCalled();
    // Ne réécrit pas verificationCreditSpentAt (déjà posé, pas la peine).
    const call = propertyUpdate.mock.calls[0][0];
    expect(call.data.verificationCreditSpentAt).toBeUndefined();
  });

  it("HOTE : une annonce déjà payée À VIE reste vérifiable sans repayer, même à solde 0", async () => {
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      verified: false,
      verificationCreditSpentAt: new Date("2026-06-01"),
      ownerId: "clowner00000000000000000012",
      owner: { kycStatus: "VERIFIE", role: "HOTE" },
    });
    walletUpdateMany.mockResolvedValue({ count: 0 });

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    fd.set("verificationLevel", "REMOTE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.success).toBeDefined();
    expect(walletUpdateMany).not.toHaveBeenCalled();
    expect(notifyHostVerificationPaymentRequired).not.toHaveBeenCalled();
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

  // ── P6.2 : bypass AGENCE tant que la monétisation n'est pas lancée ─────────

  it("P6.2 — n'applique plus le quota d'annonces d'une agence tant que le flag est désactivé", async () => {
    vi.stubEnv("GROWTH_MONETIZATION_ENABLED", "false");
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      verified: false,
      ownerId: "clowner00000000000000000008",
      owner: { kycStatus: "VERIFIE", role: "AGENCE" },
    });
    subscriptionFindUnique.mockResolvedValue(null);
    propertyCount.mockResolvedValue(50); // très au-delà du palier gratuit (3)

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    fd.set("verificationLevel", "REMOTE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.success).toBeDefined();
    expect(propertyUpdate).toHaveBeenCalled();
    expect(notifyAgencyQuotaReached).not.toHaveBeenCalled();
  });

  it("P6.2 — ne consomme plus de crédit de vérification d'une agence tant que le flag est désactivé", async () => {
    vi.stubEnv("GROWTH_MONETIZATION_ENABLED", "false");
    (requireWakilOrAdmin as unknown as Mock).mockResolvedValue(mockAdmin);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      verified: false,
      ownerId: "clowner00000000000000000009",
      owner: { kycStatus: "VERIFIE", role: "AGENCE" },
    });
    subscriptionFindUnique.mockResolvedValue(null);
    propertyCount.mockResolvedValue(0);
    walletUpdateMany.mockResolvedValue({ count: 0 }); // solde épuisé — ne doit pas bloquer

    const fd = new FormData();
    fd.set("propertyId", PROP_ID);
    fd.set("verificationLevel", "REMOTE");
    const result = await verifyPropertyAction(undefined, fd);

    expect(result?.success).toBeDefined();
    expect(propertyUpdate).toHaveBeenCalled();
    expect(walletUpsert).not.toHaveBeenCalled();
    expect(notifyAgencyOutOfVerificationCredits).not.toHaveBeenCalled();
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
