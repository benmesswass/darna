/**
 * LANCEMENT_ROADMAP.md §L3.2 — réconciliation Konnect↔local : réutilise les
 * settlements idempotents existants (jamais de nouveau code de règlement),
 * ne signale (warn) qu'un drift réellement rattrapé, alerte l'observabilité
 * sur ERREUR, isole les entités entre elles.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findMany: vi.fn() },
    hostInvoice: { findMany: vi.fn() },
    featuredOrder: { findMany: vi.fn() },
    verificationCreditOrder: { findMany: vi.fn() },
    subscription: { findMany: vi.fn() },
  },
}));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn(), logAudit: vi.fn() }));
vi.mock("@/lib/observability", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/payments", () => ({ settleKonnectBooking: vi.fn() }));
vi.mock("@/lib/host-invoicing", () => ({ settleHostInvoice: vi.fn() }));
vi.mock("@/lib/featured-payments", () => ({ settleFeaturedOrder: vi.fn() }));
vi.mock("@/lib/subscription-payments", () => ({ settleSubscriptionPayment: vi.fn() }));
vi.mock("@/lib/verification-credit-payments", () => ({ settleVerificationCreditOrder: vi.fn() }));

import { reconcileKonnectPayments } from "@/lib/jobs/konnect-reconciliation";
import { prisma } from "@/lib/prisma";
import { captureError } from "@/lib/observability";
import { settleKonnectBooking } from "@/lib/payments";
import { settleHostInvoice } from "@/lib/host-invoicing";
import { settleFeaturedOrder } from "@/lib/featured-payments";
import { settleSubscriptionPayment } from "@/lib/subscription-payments";
import { settleVerificationCreditOrder } from "@/lib/verification-credit-payments";

const bookingFindMany = prisma.booking.findMany as unknown as Mock;
const hostInvoiceFindMany = prisma.hostInvoice.findMany as unknown as Mock;
const featuredFindMany = prisma.featuredOrder.findMany as unknown as Mock;
const creditFindMany = prisma.verificationCreditOrder.findMany as unknown as Mock;
const subscriptionFindMany = prisma.subscription.findMany as unknown as Mock;

const settleBookingMock = settleKonnectBooking as unknown as Mock;
const settleInvoiceMock = settleHostInvoice as unknown as Mock;
const settleFeaturedMock = settleFeaturedOrder as unknown as Mock;
const settleCreditMock = settleVerificationCreditOrder as unknown as Mock;
const settleSubscriptionMock = settleSubscriptionPayment as unknown as Mock;
const captureErrorMock = captureError as unknown as Mock;

type Rows = { id: string }[];

function setFindManyResults(overrides: {
  booking?: Rows;
  hostInvoice?: Rows;
  featuredOrder?: Rows;
  verificationCreditOrder?: Rows;
  subscription?: Rows;
}) {
  bookingFindMany.mockResolvedValue(overrides.booking ?? []);
  hostInvoiceFindMany.mockResolvedValue(overrides.hostInvoice ?? []);
  featuredFindMany.mockResolvedValue(overrides.featuredOrder ?? []);
  creditFindMany.mockResolvedValue(overrides.verificationCreditOrder ?? []);
  subscriptionFindMany.mockResolvedValue(overrides.subscription ?? []);
}

beforeEach(() => {
  vi.clearAllMocks();
  setFindManyResults({});
});

describe("reconcileKonnectPayments", () => {
  it("ne signale rien quand un paiement reste EN_ATTENTE côté Konnect (pas de drift)", async () => {
    setFindManyResults({ booking: [{ id: "b1" }] });
    settleBookingMock.mockResolvedValue("EN_ATTENTE");

    const summary = await reconcileKonnectPayments();

    expect(settleBookingMock).toHaveBeenCalledWith({ bookingId: "b1" });
    expect(summary.Booking).toEqual({ checked: 1, caught: 0 });
    expect(captureErrorMock).not.toHaveBeenCalled();
  });

  it("rattrape un drift (Konnect payé, local encore en attente) et le journalise", async () => {
    setFindManyResults({ hostInvoice: [{ id: "inv1" }] });
    settleInvoiceMock.mockResolvedValue("PAYEE");

    const summary = await reconcileKonnectPayments();

    expect(settleInvoiceMock).toHaveBeenCalledWith({ invoiceId: "inv1" });
    expect(summary.HostInvoice).toEqual({ checked: 1, caught: 1 });
    expect(captureErrorMock).not.toHaveBeenCalled();
  });

  it("alerte l'observabilité quand un settlement échoue (ERREUR)", async () => {
    setFindManyResults({ featuredOrder: [{ id: "f1" }] });
    settleFeaturedMock.mockResolvedValue("ERREUR");

    const summary = await reconcileKonnectPayments();

    expect(summary.FeaturedOrder).toEqual({ checked: 1, caught: 0 });
    expect(captureErrorMock).toHaveBeenCalledTimes(1);
  });

  it("réconcilie les Subscription par paymentRef, indépendamment du statut (peut déjà être ACTIF pendant un renouvellement)", async () => {
    setFindManyResults({ subscription: [{ id: "sub1" }] });
    settleSubscriptionMock.mockResolvedValue("ACTIF");

    const summary = await reconcileKonnectPayments();

    expect(subscriptionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { paymentRef: { not: null } } })
    );
    expect(settleSubscriptionMock).toHaveBeenCalledWith({ subscriptionId: "sub1" });
    expect(summary.Subscription).toEqual({ checked: 1, caught: 1 });
  });

  it("réconcilie les VerificationCreditOrder aussi", async () => {
    setFindManyResults({ verificationCreditOrder: [{ id: "c1" }] });
    settleCreditMock.mockResolvedValue("PAYEE");

    const summary = await reconcileKonnectPayments();

    expect(settleCreditMock).toHaveBeenCalledWith({ orderId: "c1" });
    expect(summary.VerificationCreditOrder).toEqual({ checked: 1, caught: 1 });
  });

  it("isole les entités : un findMany qui échoue pour l'une n'empêche pas les autres", async () => {
    bookingFindMany.mockRejectedValue(new Error("db down"));
    hostInvoiceFindMany.mockResolvedValue([]);
    featuredFindMany.mockResolvedValue([{ id: "f1" }]);
    creditFindMany.mockResolvedValue([]);
    subscriptionFindMany.mockResolvedValue([]);
    settleFeaturedMock.mockResolvedValue("EN_ATTENTE");

    const summary = await reconcileKonnectPayments();

    expect(summary.Booking).toEqual({ checked: 0, caught: 0 });
    expect(summary.FeaturedOrder).toEqual({ checked: 1, caught: 0 });
    expect(captureErrorMock).toHaveBeenCalledWith(expect.any(Error), {
      entity: "Booking",
      phase: "reconciliation",
    });
  });

  it("filtre par status EN_ATTENTE + paymentRef non-null + créé il y a plus de 30 min (Booking/HostInvoice/FeaturedOrder/VerificationCreditOrder)", async () => {
    setFindManyResults({});

    await reconcileKonnectPayments();

    for (const mock of [bookingFindMany, hostInvoiceFindMany, featuredFindMany, creditFindMany]) {
      const call = mock.mock.calls[0][0];
      expect(call.where.status).toBe("EN_ATTENTE");
      expect(call.where.paymentRef).toEqual({ not: null });
      expect(call.where.createdAt.lt).toBeInstanceOf(Date);
    }
  });

  it("est rejouable : appeler deux fois sur le même état redonne le même résultat", async () => {
    setFindManyResults({ booking: [{ id: "b1" }] });
    settleBookingMock.mockResolvedValue("EN_ATTENTE");

    const first = await reconcileKonnectPayments();
    const second = await reconcileKonnectPayments();

    expect(first).toEqual(second);
  });
});
