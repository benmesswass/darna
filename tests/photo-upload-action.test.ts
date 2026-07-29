/**
 * D7 (QA_ROADMAP §3) — un fichier malveillant (mauvaise signature/magic
 * bytes) est rejeté par l'ACTION `addPhotosAction`, pas seulement par la lib
 * (`readValidatedImage`, déjà couverte par tests/storage.test.ts). La chaîne
 * de validation (`@/lib/uploads` → `@/lib/storage`) n'est PAS mockée ici :
 * elle tourne réellement, seuls `prisma`/la session/l'i18n le sont — preuve
 * que l'action vérifie bien la valeur de retour avant d'écrire en base.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn() },
    photo: { count: vi.fn(), createMany: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ requireLister: vi.fn(), requireUser: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    annonceForm: {
      erreurUpload: "Fichier refusé.",
      maxPhotos: (n: number) => `Maximum ${n} photos.`,
      photosAjoutees: "Photos ajoutées !",
    },
    common: { erreurInconnue: "Erreur inconnue." },
  }),
}));

import { addPhotosAction } from "@/actions/properties";
import { prisma } from "@/lib/prisma";
import { requireLister, requireUser } from "@/lib/session";
import { MAX_PHOTOS_PER_PROPERTY } from "@/lib/constants";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const photoCount = prisma.photo.count as unknown as Mock;
const photoCreateMany = prisma.photo.createMany as unknown as Mock;
const requireListerMock = requireLister as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;

const HOST = { id: "host-1" };
const PROPERTY = { id: "clproperty000000000000001", ownerId: HOST.id, title: "Villa" };

// PNG (0x89 0x50 0x4e 0x47…) présenté avec un MIME image/jpeg — même fixture
// que tests/storage.test.ts, signature falsifiée détectée par magic bytes.
const FAKE_JPEG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]);

function formWith(file: File): FormData {
  const fd = new FormData();
  fd.set("propertyId", PROPERTY.id);
  fd.append("photos", file);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireListerMock.mockResolvedValue(HOST);
  requireUserMock.mockResolvedValue(HOST); // requireOwnProperty() rappelle requireUser() en interne
  propertyFindUnique.mockResolvedValue(PROPERTY);
  photoCount.mockResolvedValue(0);
});

describe("addPhotosAction — rejet d'un fichier malveillant (D7)", () => {
  it("refuse une signature falsifiée (PNG déguisé en JPEG) sans jamais écrire de Photo", async () => {
    const malicious = new File([FAKE_JPEG_BYTES], "x.jpg", { type: "image/jpeg" });

    const result = await addPhotosAction(undefined, formWith(malicious));

    expect(result).toEqual({ error: "Fichier refusé." });
    expect(photoCreateMany).not.toHaveBeenCalled();
  });

  it("refuse un fichier vide sans jamais écrire de Photo", async () => {
    const empty = new File([], "x.jpg", { type: "image/jpeg" });

    const result = await addPhotosAction(undefined, formWith(empty));

    // Filtré en amont (`f.size > 0`) : aucun fichier valide → même erreur.
    expect(result).toEqual({ error: "Fichier refusé." });
    expect(photoCreateMany).not.toHaveBeenCalled();
  });
});

describe("addPhotosAction — borne MAX_PHOTOS_PER_PROPERTY (P2.7)", () => {
  it("refuse un ajout qui dépasserait la limite (existantes + nouvelles), sans jamais écrire de Photo", async () => {
    photoCount.mockResolvedValue(MAX_PHOTOS_PER_PROPERTY);
    // Le contrôle de borne précède la validation/le ré-encodage de l'image :
    // même une signature falsifiée (fixture partagée) doit être bloquée ici,
    // sans jamais atteindre readValidatedImage.
    const file = new File([FAKE_JPEG_BYTES], "x.jpg", { type: "image/jpeg" });

    const result = await addPhotosAction(undefined, formWith(file));

    expect(result).toEqual({ error: `Maximum ${MAX_PHOTOS_PER_PROPERTY} photos.` });
    expect(photoCreateMany).not.toHaveBeenCalled();
  });
});
