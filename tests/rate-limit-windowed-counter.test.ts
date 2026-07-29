/**
 * P2.10 (ROADMAP.md) — incrementWindowedCounter() (src/lib/rate-limit.ts),
 * chemin in-memory (sans Redis) : n'avait AUCUNE couverture directe ailleurs
 * (ex. login-failure-tracking.test.ts mocke le module @/lib/rate-limit
 * entier). Le chemin Redis + le repli sur erreur Redis sont couverts par
 * tests/rate-limit-redis.test.ts et tests/rate-limit-redis-fallback.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/redis", () => ({ getRedis: () => null }));

import { incrementWindowedCounter } from "@/lib/rate-limit";

describe("incrementWindowedCounter — fallback in-memory (sans Redis, P2.10)", () => {
  afterEach(() => vi.useRealTimers());

  it("incrémente à chaque appel pour une même clé", async () => {
    const key = `wc-mem-${Math.random()}`;

    expect(await incrementWindowedCounter(key, 60_000)).toBe(1);
    expect(await incrementWindowedCounter(key, 60_000)).toBe(2);
    expect(await incrementWindowedCounter(key, 60_000)).toBe(3);
  });

  it("isole les compteurs par clé", async () => {
    const keyA = `wc-mem-a-${Math.random()}`;
    const keyB = `wc-mem-b-${Math.random()}`;

    await incrementWindowedCounter(keyA, 60_000);
    await incrementWindowedCounter(keyA, 60_000);
    expect(await incrementWindowedCounter(keyB, 60_000)).toBe(1);
  });

  it("réinitialise le compteur une fois la fenêtre expirée", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T10:00:00Z"));
    const key = `wc-window-${Math.random()}`;

    expect(await incrementWindowedCounter(key, 1000)).toBe(1);
    expect(await incrementWindowedCounter(key, 1000)).toBe(2);

    vi.setSystemTime(new Date("2026-06-16T10:00:01.500Z")); // > 1000 ms plus tard
    expect(await incrementWindowedCounter(key, 1000)).toBe(1);
  });
});
