/**
 * P2.3 (ROADMAP.md, bypass de rate limit) — clientIp() (src/lib/rate-limit.ts)
 * ne doit JAMAIS faire confiance à un en-tête spoofable (`x-forwarded-for`)
 * hors développement local ou derrière un proxy de confiance explicitement
 * déclaré (`TRUSTED_PROXY=true`). Aucun test existant n'exerçait le vrai
 * comportement de cette fonction avec un en-tête réel (tous mockent
 * `next/headers` à vide ou remplacent `clientIp` elle-même) — celui-ci
 * fournit un vrai en-tête forgé et vérifie qu'il est bien ignoré.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { headers } from "next/headers";
import { clientIp } from "@/lib/rate-limit";

const headersMock = vi.mocked(headers);

describe("clientIp — résistance au spoofing", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    headersMock.mockReset();
  });

  it("production SANS TRUSTED_PROXY : un x-forwarded-for forgé est ignoré (bucket « untrusted »)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRUSTED_PROXY", "false");
    headersMock.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.66" }) as never
    );

    expect(await clientIp()).toBe("untrusted");
  });

  it("production SANS TRUSTED_PROXY (variable absente) : même résultat", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRUSTED_PROXY", "");
    delete process.env.TRUSTED_PROXY;
    headersMock.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.66" }) as never
    );

    expect(await clientIp()).toBe("untrusted");
  });

  it("production AVEC TRUSTED_PROXY=true : honore cf-connecting-ip (posé par le proxy, pas le client)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRUSTED_PROXY", "true");
    headersMock.mockResolvedValue(
      new Headers({
        "cf-connecting-ip": "198.51.100.7",
        // Un en-tête client forgé, présent EN MÊME TEMPS : ne doit jamais
        // l'emporter sur celui posé par le proxy de confiance.
        "x-forwarded-for": "1.2.3.4",
      }) as never
    );

    expect(await clientIp()).toBe("198.51.100.7");
  });

  it("production AVEC TRUSTED_PROXY=true, sans cf-connecting-ip : replie sur x-real-ip, jamais x-forwarded-for", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRUSTED_PROXY", "true");
    headersMock.mockResolvedValue(
      new Headers({
        "x-real-ip": "198.51.100.9",
        "x-forwarded-for": "1.2.3.4",
      }) as never
    );

    expect(await clientIp()).toBe("198.51.100.9");
  });

  it("développement (NODE_ENV≠production) : x-forwarded-for reste honoré (confort dev, comportement existant)", async () => {
    vi.stubEnv("NODE_ENV", "test");
    headersMock.mockResolvedValue(
      new Headers({ "x-forwarded-for": "10.0.0.42" }) as never
    );

    expect(await clientIp()).toBe("10.0.0.42");
  });
});
