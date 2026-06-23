/**
 * D3 (QA_ROADMAP §3) — IDOR sur les annonces.
 *
 * Prouve qu'un utilisateur ne peut PAS muter l'annonce d'un autre. Deux styles
 * de garde coexistent dans properties.ts :
 *   1. requireOwnProperty() → lève Error("ACCES_REFUSE") si ownerId ≠ user.id
 *      (republishPropertyAction, featureListingAction, …).
 *   2. contrôle inline `ownerId !== user.id → return` silencieux
 *      (deletePhotoAction, setCoverPhotoAction, …).
 * On couvre les deux + un contrôle positif (le propriétaire passe).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn(), update: vi.fn() },
    photo: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn(), requireLister: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("@/lib/uploads", () => ({
  MAX_PHOTOS_PER_PROPERTY: 10,
  saveUploadedImage: vi.fn(),
  deleteUploadedImage: vi.fn(),
}));
vi.mock("@/lib/admin-notify", () => ({ notifyAdmins: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { erreurInconnue: "Erreur inconnue.", champsRequis: "Champs requis." },
    annonceForm: { erreurUpload: "Erreur upload." },
  }),
}));

import {
  republishPropertyAction,
  featureListingAction,
  deletePhotoAction,
} from "@/actions/properties";
import { prisma } from "@/lib/prisma";
import { requireUser, requireLister } from "@/lib/session";
import { deleteUploadedImage } from "@/lib/uploads";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const propertyUpdate = prisma.property.update as unknown as Mock;
const photoFindUnique = prisma.photo.findUnique as unknown as Mock;
const photoDelete = prisma.photo.delete as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const requireListerMock = requireLister as unknown as Mock;
const deleteUploadedImageMock = deleteUploadedImage as unknown as Mock;

const OWNER = { id: "owner-A", role: "HOTE" };
const ATTACKER = { id: "attacker-B", role: "HOTE" };
const PROP_ID = "clproperty000000000000001";
const PHOTO_ID = "clphoto00000000000000001";

beforeEach(() => {
  vi.clearAllMocks();
  propertyUpdate.mockResolvedValue({});
  photoDelete.mockResolvedValue({});
  deleteUploadedImageMock.mockResolvedValue(undefined);
});

function form(field: string, value: string): FormData {
  const fd = new FormData();
  fd.set(field, value);
  return fd;
}

describe("requireOwnProperty (republish / feature) — IDOR", () => {
  it("republishPropertyAction lève ACCES_REFUSE sur l'annonce d'autrui (aucune écriture)", async () => {
    requireUserMock.mockResolvedValue(ATTACKER);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      ownerId: OWNER.id,
      type: "LOCATION",
      slug: "appart-tunis",
      title: "Appart",
    });

    await expect(republishPropertyAction(form("propertyId", PROP_ID))).rejects.toThrow(
      "ACCES_REFUSE"
    );
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("featureListingAction lève ACCES_REFUSE quand un autre hôte tente la mise à la une", async () => {
    requireListerMock.mockResolvedValue(ATTACKER);
    requireUserMock.mockResolvedValue(ATTACKER);
    propertyFindUnique.mockResolvedValue({
      id: PROP_ID,
      ownerId: OWNER.id,
      type: "SEJOUR",
      slug: "villa",
      title: "Villa",
    });

    await expect(featureListingAction(form("propertyId", PROP_ID))).rejects.toThrow(
      "ACCES_REFUSE"
    );
    expect(propertyUpdate).not.toHaveBeenCalled();
  });
});

describe("deletePhotoAction (garde inline) — IDOR", () => {
  it("ignore la suppression d'une photo appartenant à un autre (aucune suppression)", async () => {
    requireUserMock.mockResolvedValue(ATTACKER);
    photoFindUnique.mockResolvedValue({
      id: PHOTO_ID,
      url: "/uploads/photo.jpg",
      property: { id: PROP_ID, slug: "villa", ownerId: OWNER.id },
    });

    await deletePhotoAction(form("photoId", PHOTO_ID));

    expect(photoDelete).not.toHaveBeenCalled();
    expect(deleteUploadedImageMock).not.toHaveBeenCalled();
  });

  it("autorise le propriétaire à supprimer sa photo (contrôle positif)", async () => {
    requireUserMock.mockResolvedValue(OWNER);
    photoFindUnique.mockResolvedValue({
      id: PHOTO_ID,
      url: "/uploads/photo.jpg",
      property: { id: PROP_ID, slug: "villa", ownerId: OWNER.id },
    });

    await deletePhotoAction(form("photoId", PHOTO_ID));

    expect(photoDelete).toHaveBeenCalledWith({ where: { id: PHOTO_ID } });
  });
});
