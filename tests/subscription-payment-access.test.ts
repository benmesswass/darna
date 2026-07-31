/**
 * MONETISATION_IMMO_ROADMAP.md §MI2 — non-bypass sur l'initiation du paiement
 * d'abonnement : réservé aux comptes AGENCE (le mécanisme ne cible pas les
 * hôtes individuels), et garde d'exclusivité démo/réel. Contrairement à
 * startFeaturedOrderPaymentAction, aucun id n'est reçu du client ici (l'action
 * opère toujours sur l'abonnement de l'utilisateur connecté, relation 1:1) —
 * donc pas de test IDOR "mauvais propriétaire" à écrire, juste le rôle et
 * l'exclusivité démo/réel.
 */
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { upsert: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    verificationWallet: { upsert: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => false),
  initKonnectPayment: vi.fn(),
  signKonnectWebhook: vi.fn(() => "sig"),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { erreurInconnue: "Erreur inconnue." },
    abonnement: { paiementErreur: "Erreur de paiement." },
  }),
}));

import {
  startSubscriptionPaymentAction,
  subscribeAgencyPlanAction,
} from "@/actions/subscriptions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isKonnectEnabled, initKonnectPayment } from "@/lib/konnect";
import { logAudit } from "@/lib/audit";

const subUpsert = prisma.subscription.upsert as unknown as Mock;
const subUpdate = prisma.subscription.update as unknown as Mock;
const subFindUnique = prisma.subscription.findUnique as unknown as Mock;
const walletUpsert = prisma.verificationWallet.upsert as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const isKonnectEnabledMock = isKonnectEnabled as unknown as Mock;
const initKonnectMock = initKonnectPayment as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;

const AGENCE = { id: "agence-A", name: "Agence Test", email: "a@test.tn", phone: null, role: "AGENCE" };
const HOTE = { id: "hote-B", name: "Hôte Test", email: "h@test.tn", phone: null, role: "HOTE" };

function planForm(plan = "STANDARD"): FormData {
  const fd = new FormData();
  fd.set("plan", plan);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  subUpsert.mockResolvedValue({ id: "sub_1" });
  subUpdate.mockResolvedValue({});
  subFindUnique.mockResolvedValue(null);
  walletUpsert.mockResolvedValue({});
  // P6.2 (ROADMAP.md) : l'abonnement agence est masqué par défaut avant
  // lancement — ce fichier teste le rôle/l'exclusivité démo-réel de
  // l'abonnement lui-même (hors périmètre P6.2), donc l'active pour ne pas
  // court-circuiter ces tests sur la nouvelle garde.
  vi.stubEnv("GROWTH_MONETIZATION_ENABLED", "true");
});

afterEach(() => vi.unstubAllEnvs());

describe("startSubscriptionPaymentAction — non-bypass", () => {
  it("refuse un compte HOTE (le mécanisme d'abonnement ne cible que les agences)", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    requireUserMock.mockResolvedValue(HOTE);

    const result = await startSubscriptionPaymentAction(undefined, planForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(subUpsert).not.toHaveBeenCalled();
    expect(initKonnectMock).not.toHaveBeenCalled();
  });

  it("autorise un compte AGENCE (contrôle positif)", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    requireUserMock.mockResolvedValue(AGENCE);
    initKonnectMock.mockResolvedValue({ payUrl: "https://konnect.test/pay", paymentRef: "pay_1" });

    const result = await startSubscriptionPaymentAction(undefined, planForm());

    expect(result).toEqual({ payUrl: "https://konnect.test/pay" });
    expect(subUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: AGENCE.id },
        create: expect.objectContaining({ userId: AGENCE.id, plan: "STANDARD" }),
      })
    );
    expect(initKonnectMock).toHaveBeenCalledWith(
      expect.objectContaining({ amountTND: 100, orderId: "sub_1" })
    );
    expect(subUpdate).toHaveBeenCalledWith({
      where: { id: "sub_1" },
      data: { paymentRef: "pay_1" },
    });
  });

  it("refuse quand Konnect est désactivé (exclusivité démo/réel)", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(AGENCE);

    const result = await startSubscriptionPaymentAction(undefined, planForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(subUpsert).not.toHaveBeenCalled();
  });

  it("refuse un palier inconnu", async () => {
    isKonnectEnabledMock.mockReturnValue(true);
    requireUserMock.mockResolvedValue(AGENCE);
    const fd = new FormData();
    fd.set("plan", "PALIER_INEXISTANT");

    const result = await startSubscriptionPaymentAction(undefined, fd);

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(subUpsert).not.toHaveBeenCalled();
  });

  it("P6.2 — refuse tant que l'abonnement agence est masqué (avant lancement)", async () => {
    vi.stubEnv("GROWTH_MONETIZATION_ENABLED", "false");
    isKonnectEnabledMock.mockReturnValue(true);
    requireUserMock.mockResolvedValue(AGENCE);

    const result = await startSubscriptionPaymentAction(undefined, planForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(subUpsert).not.toHaveBeenCalled();
  });
});

describe("subscribeAgencyPlanAction (démo) — garde d'exclusivité et rôle", () => {
  it("ne fait rien quand Konnect est actif (anti-confusion démo/réel)", async () => {
    isKonnectEnabledMock.mockReturnValue(true);

    await subscribeAgencyPlanAction(planForm());

    expect(requireUserMock).not.toHaveBeenCalled();
    expect(subUpsert).not.toHaveBeenCalled();
    expect(logAuditMock).not.toHaveBeenCalled();
  });

  it("ne fait rien pour un compte HOTE", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(HOTE);

    await subscribeAgencyPlanAction(planForm());

    expect(subUpsert).not.toHaveBeenCalled();
  });

  it("active l'abonnement d'un compte AGENCE en mode démo", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(AGENCE);
    subFindUnique.mockResolvedValue(null);

    await subscribeAgencyPlanAction(planForm());

    expect(subUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: AGENCE.id },
        create: expect.objectContaining({ plan: "STANDARD", status: "ACTIF" }),
        update: expect.objectContaining({ plan: "STANDARD", status: "ACTIF" }),
      })
    );
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "AGENCY_SUBSCRIPTION_PAID", userId: AGENCE.id })
    );
  });

  // ── MI3bis (décision Wassim du 2026-07-20) : bonus de crédits Starter ──────

  it("accorde le bonus de 3 crédits de vérification à la 1re souscription Starter", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(AGENCE);
    subFindUnique.mockResolvedValue({ currentPeriodEnd: null, starterBonusGranted: false });

    await subscribeAgencyPlanAction(planForm("STARTER"));

    expect(walletUpsert).toHaveBeenCalledWith({
      where: { userId: AGENCE.id },
      create: { userId: AGENCE.id, balance: 1 + 3 }, // FREE_VERIFICATION_CREDITS + bonus Starter
      update: { balance: { increment: 3 } },
    });
    expect(subUpdate).toHaveBeenCalledWith({
      where: { userId: AGENCE.id },
      data: { starterBonusGranted: true },
    });
  });

  it("NE reconduit PAS le bonus Starter à un renouvellement (déjà accordé une fois)", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(AGENCE);
    const future = new Date(Date.now() + 5 * 864e5);
    subFindUnique.mockResolvedValue({ currentPeriodEnd: future, starterBonusGranted: true });

    await subscribeAgencyPlanAction(planForm("STARTER"));

    expect(walletUpsert).not.toHaveBeenCalled();
    // subUpdate n'est PAS rappelé pour starterBonusGranted (déjà true) — seul
    // subUpsert (souscription elle-même) est invoqué.
    expect(subUpdate).not.toHaveBeenCalled();
  });

  it("n'accorde aucun bonus pour Standard/Pro (verificationCreditsBonus = 0)", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(AGENCE);
    subFindUnique.mockResolvedValue({ currentPeriodEnd: null, starterBonusGranted: false });

    await subscribeAgencyPlanAction(planForm("STANDARD"));

    expect(walletUpsert).not.toHaveBeenCalled();
  });

  // ── MI4 (décision Wassim du 2026-07-20) : boost offert par cycle ───────────

  it("remet freeBoostUsedAt à null à chaque règlement démo (nouveau cycle, MI4)", async () => {
    isKonnectEnabledMock.mockReturnValue(false);
    requireUserMock.mockResolvedValue(AGENCE);
    subFindUnique.mockResolvedValue(null);

    await subscribeAgencyPlanAction(planForm("PRO"));

    expect(subUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ freeBoostUsedAt: null }),
        update: expect.objectContaining({ freeBoostUsedAt: null }),
      })
    );
  });
});
