import { afterEach, describe, expect, it, vi } from "vitest";

// Pas de REDIS_URL en test → on force le chemin fallback in-memory et on évite
// de tirer prisma via audit.
vi.mock("@/lib/redis", () => ({ getRedis: () => null }));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));

import { cached, cacheDelete } from "@/lib/cache";

describe("cached (fallback in-memory)", () => {
  afterEach(() => vi.useRealTimers());

  it("calcule une fois puis sert depuis le cache pendant le TTL", async () => {
    const fn = vi.fn(async () => ({ n: 42 }));
    const a = await cached("k1", 60, fn);
    const b = await cached("k1", 60, fn);
    expect(a).toEqual({ n: 42 });
    expect(b).toEqual({ n: 42 });
    expect(fn).toHaveBeenCalledTimes(1); // 2e appel servi par le cache
  });

  it("recalcule après expiration du TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T10:00:00Z"));
    const fn = vi.fn(async () => Date.now());
    await cached("k2", 10, fn); // TTL 10 s
    vi.setSystemTime(new Date("2026-06-16T10:00:11Z")); // +11 s > TTL
    await cached("k2", 10, fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("isole les clés distinctes", async () => {
    const fn = vi.fn(async () => 1);
    await cached("a", 60, fn);
    await cached("b", 60, fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("cacheDelete force le recalcul", async () => {
    const fn = vi.fn(async () => 7);
    await cached("k3", 60, fn);
    await cacheDelete("k3");
    await cached("k3", 60, fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
