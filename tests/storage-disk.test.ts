/**
 * P2.10 (ROADMAP.md) — driver disque de src/lib/storage.ts (`diskStorage`,
 * non exporté directement : on passe par `storage`, sélectionné au chargement
 * du module selon STORAGE_MODE — fixé via vi.hoisted() car lu au top-level).
 * readValidatedImage() lui-même reste couvert par tests/storage.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import sharp from "sharp";

vi.hoisted(() => {
  delete process.env.STORAGE_MODE;
  delete process.env.STORAGE_DRIVER;
});

vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));
vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

import { storage } from "@/lib/storage";
import { mkdir, writeFile, unlink } from "node:fs/promises";

async function realJpeg(): Promise<Buffer> {
  return sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).jpeg().toBuffer();
}

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  (unlink as unknown as Mock).mockResolvedValue(undefined);
});

describe("storage (driver disque) — save (P2.10)", () => {
  it("écrit un fichier valide et retourne son URL publique /uploads/*", async () => {
    const file = new File([new Uint8Array(await realJpeg())], "x.jpg", { type: "image/jpeg" });

    const url = await storage.save(file);

    expect(url).toMatch(/^\/uploads\/[a-z0-9-]+\.jpg$/);
    expect(mkdir).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledTimes(1);
    const [writtenPath] = (writeFile as unknown as Mock).mock.calls[0];
    expect(writtenPath).toContain("public/uploads");
  });

  it("refuse un fichier invalide et n'écrit rien", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "x.jpg", { type: "image/jpeg" });

    const url = await storage.save(file);

    expect(url).toBeNull();
    expect(writeFile).not.toHaveBeenCalled();
  });
});

describe("storage (driver disque) — delete (P2.10)", () => {
  it("supprime un fichier /uploads/*.jpg connu", async () => {
    await storage.delete("/uploads/abc123-def456.jpg");
    expect(unlink).toHaveBeenCalledTimes(1);
    const [deletedPath] = (unlink as unknown as Mock).mock.calls[0];
    expect(deletedPath).toContain("abc123-def456.jpg");
  });

  it("ignore une URL hors du motif /uploads/ (jamais de path traversal)", async () => {
    await storage.delete("/uploads/../../etc/passwd");
    expect(unlink).not.toHaveBeenCalled();
  });

  it("ignore un placeholder qui ne ressemble pas à un upload réel", async () => {
    await storage.delete("https://placehold.co/x.jpg");
    expect(unlink).not.toHaveBeenCalled();
  });

  it("n'échoue pas si le fichier est déjà absent (unlink qui lève)", async () => {
    (unlink as unknown as Mock).mockRejectedValueOnce(new Error("ENOENT"));

    await expect(storage.delete("/uploads/deja-supprime.png")).resolves.toBeUndefined();
  });
});
