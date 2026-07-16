/**
 * MONETISATION_IMMO_ROADMAP.md §MI0 — règlement d'un achat de mise en avant
 * (« à la une ») via Konnect. Miroir exact de tests/host-invoicing.test.ts
 * (settleHostInvoice) : idempotence, contrôle du montant, course
 * webhook/retour — avec en plus l'effet métier (extension de
 * Property.featuredUntil), appliqué une seule fois par le "gagnant" de la
 * course.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    featuredOrder: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    property: {
      findUnique: vi.fn(),
      update: vi.fn(),
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

import { settleFeaturedOrder } from "@/lib/featured-payments";
import { prisma } from "@/lib/prisma";
import { getKonnectPayment, type KonnectPayment } from "@/lib/konnect";
import { logAudit } from "@/lib/audit";

const findFirst = prisma.featuredOrder.findFirst as unknown as Mock;
const updateMany = prisma.featuredOrder.updateMany as unknown as Mock;
const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const propertyUpdate = prisma.property.update as unknown as Mock;
const getPayment = getKonnectPayment as unknown as Mock;
const audit = logAudit as unknown as Mock;

type OrderRow = {
  id: string;
  propertyId: string;
  ownerId: string;
  status: string;
  amount: number;
  paymentRef: string | null;
};

function row(over: Partial<OrderRow> = {}): OrderRow {
  return {
    id: "order_1",
    propertyId: "prop_1",
    ownerId: "host_1",
    status: "EN_ATTENTE",
    amount: 49,
    paymentRef: "pay_1",
    ...over,
  };
}

function payment(over: Partial<KonnectPayment> = {}): KonnectPayment {
  return {
    id: "pay_1",
    status: "completed",
    amount: 49_000,
    reachedAmount: 49_000, // = 49 TND attendus
    token: "TND",
    ...over,
  };
}

describe("settleFeaturedOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMany.mockResolvedValue({ count: 1 });
    propertyFindUnique.mockResolvedValue({ featuredUntil: null });
    propertyUpdate.mockResolvedValue({});
  });

  it("retourne INTROUVABLE pour une référence inconnue (inoffensif)", async () => {
    findFirst.mockResolvedValue(null);
    expect(await settleFeaturedOrder({ paymentRef: "nope" })).toBe("INTROUVABLE");
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("est idempotent : une commande déjà PAYEE ne re-vérifie rien ni ne réapplique l'effet", async () => {
    findFirst.mockResolvedValue(row({ status: "PAYEE" }));
    expect(await settleFeaturedOrder({ orderId: "order_1" })).toBe("PAYEE");
    expect(getPayment).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("retourne EN_ATTENTE si le paiement n'a jamais été initié (paymentRef null)", async () => {
    findFirst.mockResolvedValue(row({ paymentRef: null }));
    expect(await settleFeaturedOrder({ orderId: "order_1" })).toBe("EN_ATTENTE");
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("ne règle pas tant que Konnect n'a pas abouti (pending)", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment({ status: "pending" }));
    expect(await settleFeaturedOrder({ paymentRef: "pay_1" })).toBe("EN_ATTENTE");
    expect(updateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("REFUSE de régler si le montant reçu est inférieur au dû", async () => {
    findFirst.mockResolvedValue(row({ amount: 49 }));
    getPayment.mockResolvedValue(payment({ reachedAmount: 30_000 })); // < 49 000
    expect(await settleFeaturedOrder({ paymentRef: "pay_1" })).toBe("ERREUR");
    expect(updateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("règle une commande dont le paiement est abouti et complet, et prolonge featuredUntil depuis maintenant", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment());
    propertyFindUnique.mockResolvedValue({ featuredUntil: null });

    expect(await settleFeaturedOrder({ paymentRef: "pay_1" })).toBe("PAYEE");
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order_1", status: "EN_ATTENTE" },
        data: expect.objectContaining({ status: "PAYEE" }),
      })
    );
    expect(propertyUpdate).toHaveBeenCalledWith({
      where: { id: "prop_1" },
      data: { featuredUntil: expect.any(Date) },
    });
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PROPERTY_FEATURED", userId: "host_1", success: true })
    );
  });

  it("cumule depuis la fin de boost restante si un boost est déjà actif (prolongation)", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment());
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // dans 3 jours
    propertyFindUnique.mockResolvedValue({ featuredUntil: future });

    await settleFeaturedOrder({ paymentRef: "pay_1" });

    const call = propertyUpdate.mock.calls[0][0];
    const newFeaturedUntil: Date = call.data.featuredUntil;
    // Doit partir de `future`, pas de maintenant : strictement après `future`.
    expect(newFeaturedUntil.getTime()).toBeGreaterThan(future.getTime());
  });

  it("gère la course webhook/retour : si une autre requête a déjà réglé, pas de double effet", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment());
    updateMany.mockResolvedValue({ count: 0 }); // déjà réglée par la requête concurrente

    expect(await settleFeaturedOrder({ paymentRef: "pay_1" })).toBe("PAYEE");
    expect(propertyUpdate).not.toHaveBeenCalled(); // pas de double prolongation
    expect(audit).not.toHaveBeenCalled();
  });
});
