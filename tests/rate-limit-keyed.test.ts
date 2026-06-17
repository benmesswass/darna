import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { rateLimit } from "@/lib/rate-limit";

// rateLimit borne une clé arbitraire (ici un payment_ref de webhook) — sans
// REDIS_URL en test, c'est le fallback in-memory qui s'applique.
describe("rateLimit (clé arbitraire)", () => {
  it("autorise 5 passages par clé puis bloque", async () => {
    for (let i = 0; i < 5; i++) {
      expect(await rateLimit("wh", "refA")).toBe(true);
    }
    expect(await rateLimit("wh", "refA")).toBe(false);
  });

  it("isole les compteurs par clé", async () => {
    for (let i = 0; i < 5; i++) await rateLimit("wh2", "refB");
    expect(await rateLimit("wh2", "refB")).toBe(false);
    expect(await rateLimit("wh2", "refC")).toBe(true); // autre ref : quota neuf
  });
});
