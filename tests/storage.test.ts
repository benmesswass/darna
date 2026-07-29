import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";

// storage.ts importe audit (logStructured) → on le neutralise pour ne pas tirer prisma.
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));

import { readValidatedImage } from "@/lib/storage";
import { MAX_PHOTO_SIZE } from "@/lib/constants";

// 12 octets minimum (longueur exigée par la vérif de signature). Fixtures
// fausses volontairement : suffisantes pour les cas rejetés AVANT le
// ré-encodage sharp (mauvais type/signature/taille), jamais décodées.
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0];

function fileOf(bytes: number[], type: string, extraBytes = 0): File {
  const arr = new Uint8Array(bytes.length + extraBytes);
  arr.set(bytes);
  return new File([arr], "x", { type });
}

/** Vraie image 2×2 décodable (P2.7 : le ré-encodage sharp exige un décodage réel). */
async function realImage(format: "jpeg" | "png" | "webp"): Promise<Buffer> {
  const img = sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } });
  return format === "jpeg" ? img.jpeg().toBuffer() : format === "png" ? img.png().toBuffer() : img.webp().toBuffer();
}

function realFileOf(buffer: Buffer, type: string): File {
  return new File([new Uint8Array(buffer)], "x", { type });
}

describe("readValidatedImage (barrière de sécurité upload)", () => {
  it("accepte JPEG / PNG / WebP à signature valide et les ré-encode (P2.7)", async () => {
    const jpegResult = await readValidatedImage(realFileOf(await realImage("jpeg"), "image/jpeg"));
    const pngResult = await readValidatedImage(realFileOf(await realImage("png"), "image/png"));
    const webpResult = await readValidatedImage(realFileOf(await realImage("webp"), "image/webp"));
    expect(jpegResult?.ext).toBe("jpg");
    expect(pngResult?.ext).toBe("png");
    expect(webpResult?.ext).toBe("webp");
    // Le buffer retourné est bien redécodable (preuve que c'est une vraie image ré-encodée).
    expect((await sharp(jpegResult!.buffer).metadata()).format).toBe("jpeg");
    expect((await sharp(pngResult!.buffer).metadata()).format).toBe("png");
    expect((await sharp(webpResult!.buffer).metadata()).format).toBe("webp");
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

  it("rejette un buffer à magic bytes valides mais non décodable (signature falsifiée au-delà des 12 premiers octets)", async () => {
    // Magic bytes JPEG authentiques suivis d'octets aléatoires : passe la
    // vérif de signature mais sharp ne peut pas le décoder → rejet ici.
    const fakeJpeg = fileOf([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8], "image/jpeg");
    expect(await readValidatedImage(fakeJpeg)).toBeNull();
  });

  it("supprime les métadonnées EXIF/GPS au ré-encodage (P2.7)", async () => {
    // Objet extrait (pas un littéral inline) : le typage sharp.Exif ne liste
    // que IFD0-IFD3, mais la clé GPS est bien acceptée à l'exécution — passer
    // par une variable évite l'"excess property check" du littéral inline.
    const exifWithGps = {
      IFD0: { Copyright: "Test" },
      GPS: {
        GPSLatitude: "36/1,25/1,0/1",
        GPSLatitudeRef: "N",
        GPSLongitude: "10/1,10/1,0/1",
        GPSLongitudeRef: "E",
      },
    };
    const withGps = await sharp({ create: { width: 4, height: 4, channels: 3, background: "red" } })
      .withExif(exifWithGps)
      .jpeg()
      .toBuffer();
    expect((await sharp(withGps).metadata()).exif).toBeDefined();

    const result = await readValidatedImage(realFileOf(withGps, "image/jpeg"));

    expect((await sharp(result!.buffer).metadata()).exif).toBeUndefined();
  });

  it("neutralise un payload caché après les données image valides (polyglot, P2.7)", async () => {
    const clean = await realImage("jpeg");
    const payload = Buffer.from('<?php system($_GET["c"]); ?>');
    const polyglot = Buffer.concat([clean, payload]);
    expect(polyglot.includes(payload)).toBe(true);

    const result = await readValidatedImage(realFileOf(polyglot, "image/jpeg"));

    expect(result).not.toBeNull();
    expect(result!.buffer.includes(payload)).toBe(false);
  });
});
