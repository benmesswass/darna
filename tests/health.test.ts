/**
 * LANCEMENT_ROADMAP.md §L4.1 — endpoint de santé public : jamais de secret ni
 * de détail de version, 200 si tout va bien, 503 sinon.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: vi.fn() } }));
vi.mock("@/lib/redis", () => ({ getRedis: vi.fn() }));
vi.mock("@/lib/modes", () => ({ paymentMode: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));

import { GET } from "@/app/api/health/route";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { paymentMode } from "@/lib/modes";

const queryRaw = prisma.$queryRaw as unknown as Mock;
const getRedisMock = getRedis as unknown as Mock;
const paymentModeMock = paymentMode as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  queryRaw.mockResolvedValue([{ "?column?": 1 }]);
  getRedisMock.mockReturnValue(null);
  paymentModeMock.mockReturnValue("demo");
});

describe("GET /api/health", () => {
  it("200 quand tout va bien, sans Redis configuré", async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, db: true, redis: null, mode: "demo" });
  });

  it("200 avec Redis configuré et joignable", async () => {
    const ping = vi.fn().mockResolvedValue("PONG");
    getRedisMock.mockReturnValue({ ping });

    const res = await GET();
    const body = await res.json();

    expect(ping).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, db: true, redis: true, mode: "demo" });
  });

  it("503 quand la DB est injoignable", async () => {
    queryRaw.mockRejectedValue(new Error("connection refused"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.db).toBe(false);
  });

  it("503 quand Redis est configuré mais injoignable, même si la DB va bien", async () => {
    const ping = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    getRedisMock.mockReturnValue({ ping });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.redis).toBe(false);
    expect(body.db).toBe(true);
  });

  it("ne renvoie jamais de secret ni de détail de version — seulement ok/db/redis/mode", async () => {
    const res = await GET();
    const body = await res.json();

    expect(Object.keys(body).sort()).toEqual(["db", "mode", "ok", "redis"]);
  });

  it("expose le mode paiement actif (konnect)", async () => {
    paymentModeMock.mockReturnValue("konnect");

    const res = await GET();
    const body = await res.json();

    expect(body.mode).toBe("konnect");
  });
});
