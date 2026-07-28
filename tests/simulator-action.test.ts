/**
 * INSTRUMENTATION_ROADMAP.md §IN2 / QA_ROADMAP.md §14 — sur les 4 événements
 * client IN2, seul MAP_INTERACTED avait un test direct (tests/track-event.test.ts).
 * Celui-ci couvre SIMULATOR_USED : une simulation réussie logue bien
 * l'événement avec les métadonnées attendues (ville, type, matched) — pas
 * seulement le calcul de fourchette (déjà couvert par tests/market-simulator.test.ts).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/market", () => ({ estimateRevenue: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/product-events", () => ({ getAnonId: vi.fn(), logProductEvent: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(), clientIp: vi.fn() }));

import { simulateRevenueAction } from "@/actions/simulator";
import { estimateRevenue } from "@/lib/market";
import { getSessionUser } from "@/lib/session";
import { getAnonId, logProductEvent } from "@/lib/product-events";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const estimateRevenueMock = estimateRevenue as unknown as Mock;
const getSessionUserMock = getSessionUser as unknown as Mock;
const getAnonIdMock = getAnonId as unknown as Mock;
const logProductEventMock = logProductEvent as unknown as Mock;
const rateLimitMock = rateLimit as unknown as Mock;
const clientIpMock = clientIp as unknown as Mock;

const ESTIMATE = {
  matched: true,
  sampleSize: 5,
  unit: "NUITEE",
  monthlyLow: 1000,
  monthlyHigh: 2000,
};

function form(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("city", "Hammamet");
  fd.set("type", "SEJOUR");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  rateLimitMock.mockResolvedValue(true);
  clientIpMock.mockResolvedValue("1.2.3.4");
  getAnonIdMock.mockResolvedValue("anon-1");
  getSessionUserMock.mockResolvedValue(null);
  estimateRevenueMock.mockResolvedValue(ESTIMATE);
});

describe("simulateRevenueAction — instrumentation SIMULATOR_USED", () => {
  it("logue SIMULATOR_USED avec ville/type/matched après une simulation réussie", async () => {
    await simulateRevenueAction(undefined, form());

    expect(logProductEventMock).toHaveBeenCalledWith({
      event: "SIMULATOR_USED",
      userId: null,
      anonId: "anon-1",
      metadata: { city: "Hammamet", type: "SEJOUR", matched: true },
    });
  });

  it("résout userId depuis la session si connecté", async () => {
    getSessionUserMock.mockResolvedValue({ id: "user-1" });

    await simulateRevenueAction(undefined, form());

    expect(logProductEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" })
    );
  });

  it("ne logue rien si la ville est inconnue (échec avant l'estimation)", async () => {
    const result = await simulateRevenueAction(undefined, form({ city: "Nulle-Part-Ville-Inexistante" }));

    expect(result).toEqual({ status: "error", error: "ville_inconnue" });
    expect(logProductEventMock).not.toHaveBeenCalled();
    expect(estimateRevenueMock).not.toHaveBeenCalled();
  });

  it("ne logue rien si la requête est rate-limitée", async () => {
    rateLimitMock.mockResolvedValue(false);

    const result = await simulateRevenueAction(undefined, form());

    expect(result).toEqual({ status: "error", error: "rate_limited" });
    expect(logProductEventMock).not.toHaveBeenCalled();
  });
});
