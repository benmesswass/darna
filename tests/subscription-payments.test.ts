/**
 * MONETISATION_IMMO_ROADMAP.md §MI2 — règlement d'un paiement d'abonnement
 * agence via Konnect. Miroir de tests/featured-payments.test.ts, avec une
 * différence structurelle testée explicitement : Subscription est une ligne
 * UNIQUE réutilisée à chaque cycle (pas une ligne par paiement), donc
 * l'idempotence repose sur `paymentRef` (remis à null au règlement), pas sur
 * `status` — un RENOUVELLEMENT sur un abonnement déjà ACTIF doit donc
 * fonctionner normalement (contrairement à un `updateMany` gardé par
 * `status: "EN_ATTENTE"`, qui bloquerait ce cas).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/konnect", () => ({
  getKonnectPayment: vi.fn(),
  tndToMillimes: (tnd: number) => Math.round(tnd * 1000),
}));
vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
  logStructured: vi.fn(),
}));

import { settleSubscriptionPayment } from "@/lib/subscription-payments";
import { prisma } from "@/lib/prisma";
import { getKonnectPayment, type KonnectPayment } from "@/lib/konnect";
import { logAudit } from "@/lib/audit";

const findFirst = prisma.subscription.findFirst as unknown as Mock;
const updateMany = prisma.subscription.updateMany as unknown as Mock;
const getPayment = getKonnectPayment as unknown as Mock;
const audit = logAudit as unknown as Mock;

type SubRow = {
  id: string;
  userId: string;
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
  paymentRef: string | null;
};

function row(over: Partial<SubRow> = {}): SubRow {
  return {
    id: "sub_1",
    userId: "agence_1",
    plan: "STANDARD",
    status: "EN_ATTENTE",
    currentPeriodEnd: null,
    paymentRef: "pay_1",
    ...over,
  };
}

function payment(over: Partial<KonnectPayment> = {}): KonnectPayment {
  return {
    id: "pay_1",
    status: "completed",
    amount: 250_000,
    reachedAmount: 250_000, // = 250 TND attendus (AGENCY_PLANS.STANDARD)
    token: "TND",
    ...over,
  };
}

describe("settleSubscriptionPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("retourne INTROUVABLE pour une référence inconnue (inoffensif)", async () => {
    findFirst.mockResolvedValue(null);
    expect(await settleSubscriptionPayment({ paymentRef: "nope" })).toBe("INTROUVABLE");
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("retourne EN_ATTENTE si aucun paiement en cours (paymentRef null)", async () => {
    findFirst.mockResolvedValue(row({ paymentRef: null }));
    expect(await settleSubscriptionPayment({ subscriptionId: "sub_1" })).toBe("EN_ATTENTE");
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("retourne ERREUR si le palier est inconnu (jamais censé arriver)", async () => {
    findFirst.mockResolvedValue(row({ plan: "INEXISTANT" }));
    expect(await settleSubscriptionPayment({ subscriptionId: "sub_1" })).toBe("ERREUR");
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("ne règle pas tant que Konnect n'a pas abouti (pending)", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment({ status: "pending" }));
    expect(await settleSubscriptionPayment({ paymentRef: "pay_1" })).toBe("EN_ATTENTE");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("REFUSE de régler si le montant reçu est inférieur au prix du palier", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment({ reachedAmount: 100_000 })); // < 250 000
    expect(await settleSubscriptionPayment({ paymentRef: "pay_1" })).toBe("ERREUR");
    expect(updateMany).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("active un abonnement dont le paiement est abouti et complet (souscription initiale)", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment());

    expect(await settleSubscriptionPayment({ paymentRef: "pay_1" })).toBe("ACTIF");
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "sub_1", paymentRef: "pay_1" },
      data: expect.objectContaining({
        status: "ACTIF",
        currentPeriodEnd: expect.any(Date),
        paymentRef: null,
      }),
    });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "AGENCY_SUBSCRIPTION_PAID", userId: "agence_1" })
    );
  });

  it("RENOUVELLE un abonnement déjà ACTIF (le statut ACTIF ne bloque pas le règlement, contrairement à EN_ATTENTE)", async () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // dans 3 jours
    findFirst.mockResolvedValue(
      row({ status: "ACTIF", currentPeriodEnd: future, paymentRef: "pay_2" })
    );
    getPayment.mockResolvedValue(payment({ id: "pay_2" }));

    expect(await settleSubscriptionPayment({ paymentRef: "pay_2" })).toBe("ACTIF");
    const call = updateMany.mock.calls[0][0];
    const newEnd: Date = call.data.currentPeriodEnd;
    // Cumule depuis la fin de période restante (future), pas depuis maintenant.
    expect(newEnd.getTime()).toBeGreaterThan(future.getTime());
  });

  it("gère la course webhook/retour : si une autre requête a déjà réglé, pas de double effet", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment());
    updateMany.mockResolvedValue({ count: 0 }); // déjà réglé par la requête concurrente

    expect(await settleSubscriptionPayment({ paymentRef: "pay_1" })).toBe("ACTIF");
    expect(audit).not.toHaveBeenCalled();
  });

  it("un ancien paymentRef rejoué après un nouveau cycle ne correspond plus à rien", async () => {
    // Le nouveau cycle a déjà changé paymentRef → findFirst({ paymentRef: "old" }) ne trouve rien.
    findFirst.mockResolvedValue(null);
    expect(await settleSubscriptionPayment({ paymentRef: "old" })).toBe("INTROUVABLE");
  });
});
