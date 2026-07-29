/**
 * P2.10 (ROADMAP.md) — repli sur le compteur in-memory quand Redis est
 * configuré mais indisponible (erreur réseau) : dégradation gracieuse plutôt
 * que de verrouiller les utilisateurs. Chemin non couvert jusqu'ici — les
 * autres tests Redis (tests/rate-limit-redis.test.ts) ne couvrent que le cas
 * où Redis répond normalement.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));
vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    incr: async () => {
      throw new Error("ECONNREFUSED");
    },
    pexpire: async () => 1,
  }),
}));

import { rateLimit, incrementWindowedCounter } from "@/lib/rate-limit";
import { logStructured } from "@/lib/audit";

describe("rateLimit() — Redis indisponible (repli in-memory, P2.10)", () => {
  it("retombe sur checkRateLimit, journalise, et applique quand même le quota", async () => {
    const key = `rl-fallback-${Math.random()}`;

    for (let i = 0; i < 5; i++) {
      expect(await rateLimit("action-x", key)).toBe(true);
    }
    expect(await rateLimit("action-x", key)).toBe(false);
    expect(logStructured).toHaveBeenCalledWith(
      "warn",
      "ratelimit.redis_fallback",
      expect.objectContaining({ action: "action-x" })
    );
  });
});

describe("incrementWindowedCounter() — Redis indisponible (repli in-memory, P2.10)", () => {
  it("retombe sur le compteur in-memory si Redis lève, sans jamais planter", async () => {
    const key = `wc-fallback-${Math.random()}`;

    expect(await incrementWindowedCounter(key, 60_000)).toBe(1);
    expect(await incrementWindowedCounter(key, 60_000)).toBe(2);
    expect(logStructured).toHaveBeenCalledWith(
      "warn",
      "windowed_counter.redis_fallback",
      expect.objectContaining({ key })
    );
  });
});
