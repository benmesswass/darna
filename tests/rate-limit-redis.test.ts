import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));

// Faux Redis : compteur partagé en closure → simule l'INCR atomique distribué.
vi.mock("@/lib/redis", () => {
  const counters = new Map<string, number>();
  return {
    getRedis: () => ({
      incr: async (key: string) => {
        const n = (counters.get(key) ?? 0) + 1;
        counters.set(key, n);
        return n;
      },
      pexpire: async () => 1,
    }),
  };
});

import { assertRateLimit } from "@/lib/rate-limit";

describe("assertRateLimit (chemin Redis distribué)", () => {
  it("autorise 5 tentatives puis bloque la 6e via le compteur partagé", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 6; i++) {
      results.push(await assertRateLimit("connexion-redis"));
    }
    expect(results).toEqual([true, true, true, true, true, false]);
  });
});
