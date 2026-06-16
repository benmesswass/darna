import { afterEach, describe, expect, it, vi } from "vitest";

// clientIp() lit next/headers ; on neutralise l'import pour tester checkRateLimit
// de façon unitaire (cette fonction n'appelle jamais headers() elle-même).
vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  afterEach(() => vi.useRealTimers());

  it("autorise les 5 premières tentatives puis bloque la 6e", () => {
    const ip = "ip-quota";
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("login", ip)).toBe(true);
    }
    expect(checkRateLimit("login", ip)).toBe(false);
  });

  it("isole les compteurs par IP", () => {
    expect(checkRateLimit("register", "ip-A")).toBe(true);
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("register", "ip-B")).toBe(true);
    }
    expect(checkRateLimit("register", "ip-B")).toBe(false); // ip-B épuisée
    expect(checkRateLimit("register", "ip-A")).toBe(true); // ip-A intacte (2e)
  });

  it("isole les compteurs par action", () => {
    const ip = "ip-action";
    for (let i = 0; i < 5; i++) checkRateLimit("otp", ip);
    expect(checkRateLimit("otp", ip)).toBe(false);
    expect(checkRateLimit("otp-verif", ip)).toBe(true); // autre action, quota neuf
  });

  it("réinitialise le quota après la fenêtre de 15 minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T10:00:00Z"));
    const ip = "ip-window";
    for (let i = 0; i < 5; i++) checkRateLimit("login", ip);
    expect(checkRateLimit("login", ip)).toBe(false);

    vi.setSystemTime(new Date("2026-06-16T10:15:01Z")); // > 15 min plus tard
    expect(checkRateLimit("login", ip)).toBe(true);
  });
});
