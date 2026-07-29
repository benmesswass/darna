/**
 * P2.10 (ROADMAP.md) — driver S3/R2 de src/lib/storage.ts (`s3Storage`, non
 * exporté directement : on passe par `storage`, sélectionné au chargement du
 * module selon STORAGE_MODE — fixé via vi.hoisted() car lu au top-level).
 * readValidatedImage() lui-même reste couvert par tests/storage.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

vi.hoisted(() => {
  process.env.STORAGE_MODE = "s3";
});

vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));

const mockFetch = vi.fn();
vi.mock("aws4fetch", () => ({
  AwsClient: class {
    fetch = mockFetch;
  },
}));

import { storage } from "@/lib/storage";
import { logStructured } from "@/lib/audit";

const S3_ENV = {
  S3_ENDPOINT: "https://s3.example.com",
  S3_BUCKET: "darna-photos",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
};

async function realJpegFile(): Promise<File> {
  const buf = await sharp({ create: { width: 2, height: 2, channels: 3, background: "blue" } })
    .jpeg()
    .toBuffer();
  return new File([new Uint8Array(buf)], "x.jpg", { type: "image/jpeg" });
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const [k, v] of Object.entries(S3_ENV)) process.env[k] = v;
  delete process.env.S3_PUBLIC_URL;
  delete process.env.S3_REGION;
});

describe("storage (driver S3/R2) — save (P2.10)", () => {
  it("téléverse un fichier valide et retourne son URL publique", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 200 }));

    const url = await storage.save(await realJpegFile());

    expect(url).toMatch(/^https:\/\/s3\.example\.com\/darna-photos\/uploads\/[a-z0-9-]+\.jpg$/);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("PUT");
    expect(options.headers["content-type"]).toBe("image/jpeg");
  });

  it("respecte S3_PUBLIC_URL quand il est configuré (CDN dédié)", async () => {
    process.env.S3_PUBLIC_URL = "https://cdn.darna.tn/";
    mockFetch.mockResolvedValue(new Response(null, { status: 200 }));

    const url = await storage.save(await realJpegFile());

    expect(url).toMatch(/^https:\/\/cdn\.darna\.tn\/uploads\/[a-z0-9-]+\.jpg$/);
  });

  it("refuse un fichier invalide sans jamais appeler S3", async () => {
    const badFile = new File([new Uint8Array([1, 2, 3])], "x.jpg", { type: "image/jpeg" });

    const url = await storage.save(badFile);

    expect(url).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("renvoie null et journalise si la config S3 est incomplète", async () => {
    delete process.env.S3_BUCKET;

    const url = await storage.save(await realJpegFile());

    expect(url).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(logStructured).toHaveBeenCalledWith("error", "storage.s3_misconfigured", {});
  });

  it("renvoie null et journalise si S3 répond avec un statut d'erreur", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 500 }));

    const url = await storage.save(await realJpegFile());

    expect(url).toBeNull();
    expect(logStructured).toHaveBeenCalledWith(
      "error",
      "storage.s3_put_failed",
      expect.objectContaining({ status: 500 })
    );
  });

  it("renvoie null et journalise si l'appel réseau lève (jamais d'exception qui casse l'upload)", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    const url = await storage.save(await realJpegFile());

    expect(url).toBeNull();
    expect(logStructured).toHaveBeenCalledWith(
      "error",
      "storage.s3_put_error",
      expect.objectContaining({ message: "network down" })
    );
  });
});

describe("storage (driver S3/R2) — delete (P2.10)", () => {
  it("supprime une clé /uploads/*.jpg connue", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

    await storage.delete("https://s3.example.com/darna-photos/uploads/abc-123.jpg");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("uploads/abc-123.jpg");
    expect(options.method).toBe("DELETE");
  });

  it("ignore une URL hors du motif uploads/*.(jpg|png|webp)", async () => {
    await storage.delete("https://s3.example.com/darna-photos/other/abc-123.txt");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("n'échoue pas si la config S3 est incomplète (no-op silencieux)", async () => {
    delete process.env.S3_ACCESS_KEY_ID;

    await expect(
      storage.delete("https://s3.example.com/darna-photos/uploads/abc-123.jpg")
    ).resolves.toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("n'échoue pas si l'appel réseau lève (best-effort)", async () => {
    mockFetch.mockRejectedValue(new Error("timeout"));

    await expect(
      storage.delete("https://s3.example.com/darna-photos/uploads/abc-123.jpg")
    ).resolves.toBeUndefined();
  });
});
