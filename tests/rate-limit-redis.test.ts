import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));

// Faux Redis : compteur partagé en closure → simule l'INCR atomique distribué.
// pexpireCallCount exposé pour vérifier que le TTL n'est posé qu'au 1er hit
// (P2.10) — même client (singleton), comme le vrai getRedis().
let pexpireCallCount = 0;
vi.mock("@/lib/redis", () => {
  const counters = new Map<string, number>();
  const client = {
    incr: async (key: string) => {
      const n = (counters.get(key) ?? 0) + 1;
      counters.set(key, n);
      return n;
    },
    pexpire: async () => {
      pexpireCallCount += 1;
      return 1;
    },
  };
  return { getRedis: () => client };
});

import { assertRateLimit, incrementWindowedCounter } from "@/lib/rate-limit";

describe("assertRateLimit (chemin Redis distribué)", () => {
  it("autorise 5 tentatives puis bloque la 6e via le compteur partagé", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 6; i++) {
      results.push(await assertRateLimit("connexion-redis"));
    }
    expect(results).toEqual([true, true, true, true, true, false]);
  });
});

describe("incrementWindowedCounter (chemin Redis distribué, P2.10)", () => {
  it("incrémente via Redis (INCR atomique) et pose le TTL seulement au 1er hit", async () => {
    const key = `wc-redis-${Math.random()}`;
    const before = pexpireCallCount;

    expect(await incrementWindowedCounter(key, 30_000)).toBe(1);
    expect(await incrementWindowedCounter(key, 30_000)).toBe(2);
    expect(await incrementWindowedCounter(key, 30_000)).toBe(3);

    expect(pexpireCallCount - before).toBe(1);
  });
});
