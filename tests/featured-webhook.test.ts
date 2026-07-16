/**
 * MONETISATION_IMMO_ROADMAP.md §MI0 — garde de signature du webhook Konnect
 * dédié au règlement d'un FeaturedOrder. Même garde que le webhook
 * réservation/host-invoice (verifyKonnectWebhook) : un payment_ref connu mais
 * non signé ne suffit pas à déclencher un règlement.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/featured-payments", () => ({ settleFeaturedOrder: vi.fn() }));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => true),
  verifyKonnectWebhook: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(() => true) }));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/payments/konnect/featured-webhook/route";
import { settleFeaturedOrder } from "@/lib/featured-payments";
import { isKonnectEnabled, verifyKonnectWebhook } from "@/lib/konnect";
import { rateLimit } from "@/lib/rate-limit";

const settleMock = settleFeaturedOrder as unknown as Mock;
const isEnabledMock = isKonnectEnabled as unknown as Mock;
const verifyMock = verifyKonnectWebhook as unknown as Mock;
const rateLimitMock = rateLimit as unknown as Mock;

function req(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/payments/konnect/featured-webhook?${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  isEnabledMock.mockReturnValue(true);
  rateLimitMock.mockResolvedValue(true);
  settleMock.mockResolvedValue("PAYEE");
});

describe("GET /api/payments/konnect/featured-webhook", () => {
  it("refuse (404) quand Konnect est désactivé, avant toute vérification", async () => {
    isEnabledMock.mockReturnValue(false);

    const res = await GET(req("payment_ref=pay_1&fid=order_1&sig=whatever"));

    expect(res.status).toBe(404);
    expect(verifyMock).not.toHaveBeenCalled();
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("refuse (400) sans payment_ref", async () => {
    const res = await GET(req("fid=order_1&sig=whatever"));

    expect(res.status).toBe(400);
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("refuse (401) sans fid ni sig — un payment_ref connu ne suffit pas", async () => {
    const res = await GET(req("payment_ref=pay_1"));

    expect(res.status).toBe(401);
    expect(verifyMock).not.toHaveBeenCalled();
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("refuse (401) une signature invalide (payment_ref deviné/fuité, sig forgée)", async () => {
    verifyMock.mockReturnValue(false);

    const res = await GET(req("payment_ref=pay_1&fid=order_1&sig=forged"));

    expect(res.status).toBe(401);
    expect(verifyMock).toHaveBeenCalledWith("order_1", "forged");
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("refuse (429) au-delà de la limite d'appels par commande", async () => {
    verifyMock.mockReturnValue(true);
    rateLimitMock.mockResolvedValue(false);

    const res = await GET(req("payment_ref=pay_1&fid=order_1&sig=good"));

    expect(res.status).toBe(429);
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("règle la commande (200) avec une signature valide — appelle settleFeaturedOrder avec le fid SIGNÉ, pas le payment_ref", async () => {
    verifyMock.mockReturnValue(true);

    const res = await GET(req("payment_ref=pay_1&fid=order_1&sig=good"));

    expect(res.status).toBe(200);
    expect(settleMock).toHaveBeenCalledWith({ orderId: "order_1" });
    const body = await res.json();
    expect(body).toEqual({ received: true, result: "PAYEE" });
  });
});
