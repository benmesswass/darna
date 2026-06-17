import { describe, expect, it, vi } from "vitest";

// storage.ts importe audit (logStructured) → on le neutralise pour ne pas tirer prisma.
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));

import { readValidatedImage } from "@/lib/storage";
import { MAX_PHOTO_SIZE } from "@/lib/constants";

// 12 octets minimum (longueur exigée par la vérif de signature).
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0];
// "RIFF" (0-3) .... "WEBP" (8-11)
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];

function fileOf(bytes: number[], type: string, extraBytes = 0): File {
  const arr = new Uint8Array(bytes.length + extraBytes);
  arr.set(bytes);
  return new File([arr], "x", { type });
}

describe("readValidatedImage (barrière de sécurité upload)", () => {
  it("accepte JPEG / PNG / WebP à signature valide", async () => {
    expect((await readValidatedImage(fileOf(JPEG, "image/jpeg")))?.ext).toBe("jpg");
    expect((await readValidatedImage(fileOf(PNG, "image/png")))?.ext).toBe("png");
    expect((await readValidatedImage(fileOf(WEBP, "image/webp")))?.ext).toBe("webp");
  });

  it("rejette un MIME autorisé mais à mauvaise signature (PNG déguisé en JPEG)", async () => {
    expect(await readValidatedImage(fileOf(PNG, "image/jpeg"))).toBeNull();
  });

  it("rejette un type non autorisé", async () => {
    expect(await readValidatedImage(fileOf(JPEG, "image/gif"))).toBeNull();
  });

  it("rejette un fichier trop court (< 12 octets)", async () => {
    expect(await readValidatedImage(fileOf([0xff, 0xd8, 0xff], "image/jpeg"))).toBeNull();
  });

  it("rejette un fichier vide", async () => {
    expect(await readValidatedImage(fileOf([], "image/jpeg"))).toBeNull();
  });

  it("rejette un fichier au-delà de MAX_PHOTO_SIZE", async () => {
    const big = fileOf(JPEG, "image/jpeg", MAX_PHOTO_SIZE + 1);
    expect(await readValidatedImage(big)).toBeNull();
  });
});
