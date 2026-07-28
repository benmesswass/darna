/**
 * LANCEMENT_ROADMAP.md §L6.1 — un staging/preview ne doit jamais être indexé
 * (données de démo) : seul le domaine de production exact ouvre robots.txt.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/config");
});

describe("robots", () => {
  it("désindexe tout (disallow /) hors du domaine de production", async () => {
    vi.doMock("@/lib/config", () => ({ SITE_URL: "https://staging.darna.tn" }));
    const { default: robots } = await import("@/app/robots");

    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("désindexe aussi le localhost de dev", async () => {
    vi.doMock("@/lib/config", () => ({ SITE_URL: "http://localhost:3000" }));
    const { default: robots } = await import("@/app/robots");

    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("autorise l'indexation sur le domaine de production exact", async () => {
    vi.doMock("@/lib/config", () => ({ SITE_URL: "https://darna.tn" }));
    const { default: robots } = await import("@/app/robots");
    const result = robots();

    expect(result.rules).toMatchObject({ userAgent: "*", allow: "/" });
    expect(result.sitemap).toBe("https://darna.tn/sitemap.xml");
  });
});
