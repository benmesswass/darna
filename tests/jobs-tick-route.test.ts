/**
 * LANCEMENT_ROADMAP.md §L3.1 — endpoint /api/jobs/tick : comparaison du
 * secret en temps constant, 401 sur toute entrée invalide (y compris
 * CRON_SECRET absent), délègue au runner uniquement si le secret est bon.
 */
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));
vi.mock("@/lib/jobs/runner", () => ({ runJobs: vi.fn() }));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/jobs/tick/route";
import { runJobs } from "@/lib/jobs/runner";

const runJobsMock = runJobs as unknown as Mock;
const ORIGINAL_SECRET = process.env.CRON_SECRET;
const SECRET = "a".repeat(32);

function req(auth?: string): NextRequest {
  return new NextRequest("http://localhost/api/jobs/tick", {
    headers: auth ? { authorization: auth } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  runJobsMock.mockResolvedValue([]);
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL_SECRET;
});

describe("GET /api/jobs/tick", () => {
  it("refuse (401) quand CRON_SECRET n'est pas configuré, même sans en-tête", async () => {
    delete process.env.CRON_SECRET;

    const res = await GET(req());

    expect(res.status).toBe(401);
    expect(runJobsMock).not.toHaveBeenCalled();
  });

  it("refuse (401) sans en-tête Authorization", async () => {
    process.env.CRON_SECRET = SECRET;

    const res = await GET(req());

    expect(res.status).toBe(401);
    expect(runJobsMock).not.toHaveBeenCalled();
  });

  it("refuse (401) avec un secret de même longueur mais incorrect", async () => {
    process.env.CRON_SECRET = SECRET;

    const res = await GET(req(`Bearer ${"b".repeat(32)}`));

    expect(res.status).toBe(401);
    expect(runJobsMock).not.toHaveBeenCalled();
  });

  it("refuse (401) avec un secret de longueur différente", async () => {
    process.env.CRON_SECRET = SECRET;

    const res = await GET(req("Bearer trop-court"));

    expect(res.status).toBe(401);
    expect(runJobsMock).not.toHaveBeenCalled();
  });

  it("accepte (200) le bon secret et délègue au runner", async () => {
    process.env.CRON_SECRET = SECRET;
    runJobsMock.mockResolvedValue([{ name: "demo", ok: true }]);

    const res = await GET(req(`Bearer ${SECRET}`));

    expect(res.status).toBe(200);
    expect(runJobsMock).toHaveBeenCalledTimes(1);
    const body = await res.json();
    expect(body.results).toEqual([{ name: "demo", ok: true }]);
    expect(typeof body.ranAt).toBe("string");
  });
});
