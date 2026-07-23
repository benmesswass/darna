/**
 * MONETISATION_IMMO_ROADMAP.md §MI2 — garde de signature du webhook Konnect
 * dédié au règlement d'un abonnement agence. Miroir exact de
 * tests/featured-webhook.test.ts.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/subscription-payments", () => ({ settleSubscriptionPayment: vi.fn() }));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => true),
  verifyKonnectWebhook: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(() => true) }));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/payments/konnect/subscription-webhook/route";
import { settleSubscriptionPayment } from "@/lib/subscription-payments";
import { isKonnectEnabled, verifyKonnectWebhook } from "@/lib/konnect";
import { rateLimit } from "@/lib/rate-limit";

const settleMock = settleSubscriptionPayment as unknown as Mock;
const isEnabledMock = isKonnectEnabled as unknown as Mock;
const verifyMock = verifyKonnectWebhook as unknown as Mock;
const rateLimitMock = rateLimit as unknown as Mock;

function req(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/payments/konnect/subscription-webhook?${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  isEnabledMock.mockReturnValue(true);
  rateLimitMock.mockResolvedValue(true);
  settleMock.mockResolvedValue("ACTIF");
});

describe("GET /api/payments/konnect/subscription-webhook", () => {
  it("refuse (404) quand Konnect est désactivé, avant toute vérification", async () => {
    isEnabledMock.mockReturnValue(false);

    const res = await GET(req("payment_ref=pay_1&sid=sub_1&sig=whatever"));

    expect(res.status).toBe(404);
    expect(verifyMock).not.toHaveBeenCalled();
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("refuse (400) sans payment_ref", async () => {
    const res = await GET(req("sid=sub_1&sig=whatever"));

    expect(res.status).toBe(400);
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("refuse (401) sans sid ni sig — un payment_ref connu ne suffit pas", async () => {
    const res = await GET(req("payment_ref=pay_1"));

    expect(res.status).toBe(401);
    expect(verifyMock).not.toHaveBeenCalled();
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("refuse (401) une signature invalide (payment_ref deviné/fuité, sig forgée)", async () => {
    verifyMock.mockReturnValue(false);

    const res = await GET(req("payment_ref=pay_1&sid=sub_1&sig=forged"));

    expect(res.status).toBe(401);
    expect(verifyMock).toHaveBeenCalledWith("sub_1", "forged");
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("refuse (429) au-delà de la limite d'appels par abonnement", async () => {
    verifyMock.mockReturnValue(true);
    rateLimitMock.mockResolvedValue(false);

    const res = await GET(req("payment_ref=pay_1&sid=sub_1&sig=good"));

    expect(res.status).toBe(429);
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("règle l'abonnement (200) avec une signature valide — appelle settleSubscriptionPayment avec le sid SIGNÉ, pas le payment_ref", async () => {
    verifyMock.mockReturnValue(true);

    const res = await GET(req("payment_ref=pay_1&sid=sub_1&sig=good"));

    expect(res.status).toBe(200);
    expect(settleMock).toHaveBeenCalledWith({ subscriptionId: "sub_1" });
    const body = await res.json();
    expect(body).toEqual({ received: true, result: "ACTIF" });
  });
});
