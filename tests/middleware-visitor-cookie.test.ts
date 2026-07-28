/**
 * Tests — cookie visiteur anonyme darna-vid posé par src/middleware.ts
 * (INSTRUMENTATION_ROADMAP.md §IN0). Stable entre deux requêtes, régénéré
 * si absent/mal formé, jamais lisible côté client (httpOnly).
 */
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

const VISITOR_COOKIE = "darna-vid";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("middleware — cookie visiteur darna-vid", () => {
  it("pose un id valide (UUID) quand le cookie est absent", () => {
    const req = new NextRequest("http://localhost/sejours");
    const res = middleware(req);

    const cookie = res.cookies.get(VISITOR_COOKIE);
    expect(cookie).toBeDefined();
    expect(UUID_RE.test(cookie!.value)).toBe(true);
  });

  it("ne réécrit pas un id déjà valide (stable entre deux requêtes)", () => {
    const existing = "11111111-1111-1111-1111-111111111111";
    const req = new NextRequest("http://localhost/sejours", {
      headers: { cookie: `${VISITOR_COOKIE}=${existing}` },
    });
    const res = middleware(req);

    expect(res.cookies.get(VISITOR_COOKIE)).toBeUndefined();
  });

  it("régénère un id mal formé plutôt que de lui faire confiance", () => {
    const req = new NextRequest("http://localhost/sejours", {
      headers: { cookie: `${VISITOR_COOKIE}=not-a-uuid` },
    });
    const res = middleware(req);

    const cookie = res.cookies.get(VISITOR_COOKIE);
    expect(cookie).toBeDefined();
    expect(cookie!.value).not.toBe("not-a-uuid");
    expect(UUID_RE.test(cookie!.value)).toBe(true);
  });

  it("pose le cookie en httpOnly (jamais lu côté client)", () => {
    const req = new NextRequest("http://localhost/sejours");
    const res = middleware(req);

    expect(res.cookies.get(VISITOR_COOKIE)?.httpOnly).toBe(true);
  });

  // LANCEMENT_ROADMAP.md §L7.1 — régime d'exemption CNIL "mesure d'audience" :
  // durée de vie du cookie identifiant ≤ 13 mois, sans quoi l'exemption de
  // consentement ne s'applique plus (il faudrait alors un vrai bandeau de
  // consentement bloquant).
  it("dure au maximum 13 mois (régime d'exemption CNIL mesure d'audience)", () => {
    const req = new NextRequest("http://localhost/sejours");
    const res = middleware(req);

    const THIRTEEN_MONTHS_SECONDS = 13 * 31 * 24 * 60 * 60; // borne large (mois de 31 j)
    expect(res.cookies.get(VISITOR_COOKIE)?.maxAge).toBeLessThanOrEqual(THIRTEEN_MONTHS_SECONDS);
  });
});
