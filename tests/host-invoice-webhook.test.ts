/**
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP7 — garde de signature du webhook Konnect
 * dédié au règlement d'une HostInvoice. Même garde que le webhook réservation
 * (verifyKonnectWebhook) : un payment_ref connu mais non signé ne suffit pas
 * à déclencher un règlement.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/host-invoicing", () => ({ settleHostInvoice: vi.fn() }));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => true),
  verifyKonnectWebhook: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(() => true) }));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/payments/konnect/host-invoice-webhook/route";
import { settleHostInvoice } from "@/lib/host-invoicing";
import { isKonnectEnabled, verifyKonnectWebhook } from "@/lib/konnect";
import { rateLimit } from "@/lib/rate-limit";

const settleMock = settleHostInvoice as unknown as Mock;
const isEnabledMock = isKonnectEnabled as unknown as Mock;
const verifyMock = verifyKonnectWebhook as unknown as Mock;
const rateLimitMock = rateLimit as unknown as Mock;

function req(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/payments/konnect/host-invoice-webhook?${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  isEnabledMock.mockReturnValue(true);
  rateLimitMock.mockResolvedValue(true);
  settleMock.mockResolvedValue("PAYEE");
});

describe("GET /api/payments/konnect/host-invoice-webhook", () => {
  it("refuse (404) quand Konnect est désactivé, avant toute vérification", async () => {
    isEnabledMock.mockReturnValue(false);

    const res = await GET(req("payment_ref=pay_1&iid=inv_1&sig=whatever"));

    expect(res.status).toBe(404);
    expect(verifyMock).not.toHaveBeenCalled();
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("refuse (400) sans payment_ref", async () => {
    const res = await GET(req("iid=inv_1&sig=whatever"));

    expect(res.status).toBe(400);
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("refuse (401) sans iid ni sig — un payment_ref connu ne suffit pas", async () => {
    const res = await GET(req("payment_ref=pay_1"));

    expect(res.status).toBe(401);
    expect(verifyMock).not.toHaveBeenCalled();
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("refuse (401) une signature invalide (payment_ref deviné/fuité, sig forgée)", async () => {
    verifyMock.mockReturnValue(false);

    const res = await GET(req("payment_ref=pay_1&iid=inv_1&sig=forged"));

    expect(res.status).toBe(401);
    expect(verifyMock).toHaveBeenCalledWith("inv_1", "forged");
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("refuse (429) au-delà de la limite d'appels par facture", async () => {
    verifyMock.mockReturnValue(true);
    rateLimitMock.mockResolvedValue(false);

    const res = await GET(req("payment_ref=pay_1&iid=inv_1&sig=good"));

    expect(res.status).toBe(429);
    expect(settleMock).not.toHaveBeenCalled();
  });

  it("règle la facture (200) avec une signature valide — appelle settleHostInvoice avec l'iid SIGNÉ, pas le payment_ref", async () => {
    verifyMock.mockReturnValue(true);

    const res = await GET(req("payment_ref=pay_1&iid=inv_1&sig=good"));

    expect(res.status).toBe(200);
    expect(settleMock).toHaveBeenCalledWith({ invoiceId: "inv_1" });
    const body = await res.json();
    expect(body).toEqual({ received: true, result: "PAYEE" });
  });
});
