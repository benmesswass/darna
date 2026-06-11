"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireLister, requireUser } from "@/lib/session";
import { resolveCity, getCity } from "@/lib/geo";
import { buildPropertySlug } from "@/lib/slug";
import { AMENITIES, PROPERTY_TYPES } from "@/lib/constants";
import { LISTING_LIFETIME_DAYS } from "@/lib/config";
import { logAudit } from "@/lib/audit";
import {
  MAX_PHOTOS_PER_PROPERTY,
  deleteUploadedImage,
  saveUploadedImage,
} from "@/lib/uploads";

export type PropertyFormState = { error?: string } | undefined;

const PLACEHOLDER_POOL = [
  "p-villa",
  "p-mer",
  "p-medina",
  "p-oasis",
  "p-marina",
  "p-sable",
  "p-nuit",
  "p-corail",
];

const createSchema = z
  .object({
    title: z.string().trim().min(8).max(120),
    type: z.enum(PROPERTY_TYPES),
    price: z.coerce.number().int().min(10).max(10_000_000),
    city: z.string().trim().min(2).max(60),
    address: z.string().trim().max(160).optional().or(z.literal("")),
    surface: z.coerce.number().int().min(10).max(10_000).optional().or(z.literal("")),
    rooms: z.coerce.number().int().min(1).max(30).optional().or(z.literal("")),
    maxGuests: z.coerce.number().int().min(1).max(30).optional().or(z.literal("")),
    latitude: z.coerce.number().min(30).max(38),
    longitude: z.coerce.number().min(7).max(12),
    description: z.string().trim().min(40).max(4000),
    amenities: z.array(z.enum(AMENITIES)).max(AMENITIES.length),
  })
  .refine((data) => data.type !== "SEJOUR" || Number(data.maxGuests) >= 1, {
    message: "capacite",
  });

export async function createPropertyAction(
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const fr = await getT();
  const user = await requireLister();

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    price: formData.get("price"),
    city: formData.get("city"),
    address: formData.get("address"),
    surface: formData.get("surface") || "",
    rooms: formData.get("rooms") || "",
    maxGuests: formData.get("maxGuests") || "",
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    description: formData.get("description"),
    amenities: formData.getAll("amenities"),
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const data = parsed.data;

  // La ville doit appartenir au référentiel (gouvernorat dérivé côté serveur).
  const cityName = resolveCity(data.city);
  const cityRef = cityName ? getCity(cityName) : undefined;
  if (!cityRef) return { error: fr.common.champsRequis };

  // Suffixe aléatoire 6 hex chars (~16M combinaisons) pour éviter les
  // collisions de slug en cas de créations simultanées (race condition).
  const uniqueSuffix = randomBytes(3).toString("hex");
  const slug = buildPropertySlug(data.title, cityRef.name, uniqueSuffix);

  const seedChar = data.title.length + cityRef.name.length;

  const property = await prisma.property.create({
    data: {
      slug,
      title: data.title,
      description: data.description,
      type: data.type,
      price: data.price,
      surface: data.surface ? Number(data.surface) : null,
      rooms: data.rooms ? Number(data.rooms) : null,
      maxGuests: data.type === "SEJOUR" && data.maxGuests ? Number(data.maxGuests) : null,
      city: cityRef.name,
      gouvernorat: cityRef.gouvernorat,
      address: data.address || null,
      latitude: data.latitude,
      longitude: data.longitude,
      amenities: data.amenities.join("|"),
      expiresAt: new Date(Date.now() + LISTING_LIFETIME_DAYS * 24 * 60 * 60 * 1000),
      ownerId: user.id,
      photos: {
        create: [0, 1, 2].map((n) => ({
          url: `/placeholders/${PLACEHOLDER_POOL[(seedChar + n * 3) % PLACEHOLDER_POOL.length]}.svg`,
          alt: `${data.title} — photo ${n + 1}`,
          position: n,
        })),
      },
    },
  });

  await logAudit({
    action: "PROPERTY_CREATED",
    userId: user.id,
    success: true,
    metadata: { propertyId: property.id, type: data.type, city: cityRef.name },
  });

  revalidatePath("/dashboard/annonces");
  redirect("/dashboard/annonces?creee=1");
}

/** Vérifie que l'annonce appartient bien à l'utilisateur connecté. */
async function requireOwnProperty(propertyId: string) {
  const user = await requireUser();
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true, type: true, slug: true, title: true },
  });
  if (!property || property.ownerId !== user.id) {
    throw new Error("ACCES_REFUSE");
  }
  return property;
}

// Schéma de modification : identique à la création, SANS le type —
// le type d'annonce est figé après publication (réservations liées).
const updateSchema = z.object({
  propertyId: z.string().cuid(),
  title: z.string().trim().min(8).max(120),
  price: z.coerce.number().int().min(10).max(10_000_000),
  city: z.string().trim().min(2).max(60),
  address: z.string().trim().max(160).optional().or(z.literal("")),
  surface: z.coerce.number().int().min(10).max(10_000).optional().or(z.literal("")),
  rooms: z.coerce.number().int().min(1).max(30).optional().or(z.literal("")),
  maxGuests: z.coerce.number().int().min(1).max(30).optional().or(z.literal("")),
  latitude: z.coerce.number().min(30).max(38),
  longitude: z.coerce.number().min(7).max(12),
  description: z.string().trim().min(40).max(4000),
  amenities: z.array(z.enum(AMENITIES)).max(AMENITIES.length),
});

export async function updatePropertyAction(
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const fr = await getT();
  const user = await requireLister();

  const parsed = updateSchema.safeParse({
    propertyId: formData.get("propertyId"),
    title: formData.get("title"),
    price: formData.get("price"),
    city: formData.get("city"),
    address: formData.get("address"),
    surface: formData.get("surface") || "",
    rooms: formData.get("rooms") || "",
    maxGuests: formData.get("maxGuests") || "",
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    description: formData.get("description"),
    amenities: formData.getAll("amenities"),
  });
  if (!parsed.success) return { error: fr.common.champsRequis };

  const data = parsed.data;
  // Autorisation : l'annonce doit appartenir à l'utilisateur connecté.
  const property = await requireOwnProperty(data.propertyId);

  const cityName = resolveCity(data.city);
  const cityRef = cityName ? getCity(cityName) : undefined;
  if (!cityRef) return { error: fr.common.champsRequis };

  await prisma.property.update({
    where: { id: property.id },
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      surface: data.surface ? Number(data.surface) : null,
      rooms: data.rooms ? Number(data.rooms) : null,
      maxGuests:
        property.type === "SEJOUR" && data.maxGuests ? Number(data.maxGuests) : null,
      city: cityRef.name,
      gouvernorat: cityRef.gouvernorat,
      address: data.address || null,
      latitude: data.latitude,
      longitude: data.longitude,
      amenities: data.amenities.join("|"),
      // Le slug est conservé (stabilité SEO) ; statut et expiration inchangés
      // — la republication reste l'acte explicite de fraîcheur.
    },
  });

  await logAudit({
    action: "PROPERTY_UPDATED",
    userId: user.id,
    success: true,
    metadata: { propertyId: property.id },
  });

  revalidatePath("/dashboard/annonces");
  revalidatePath(`/annonce/${property.slug}`);
  redirect("/dashboard/annonces?modifiee=1");
}

const idSchema = z.string().cuid();

/** « Marquer comme loué / vendu » en un clic — fraîcheur des données. */
export async function markPropertyClosedAction(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse(formData.get("propertyId"));
  if (!parsed.success) return;

  const property = await requireOwnProperty(parsed.data);
  if (property.type === "SEJOUR") return;

  await prisma.property.update({
    where: { id: property.id },
    data: { status: property.type === "VENTE" ? "VENDU" : "LOUE" },
  });
  revalidatePath("/dashboard/annonces");
}

/** Republication : annonce réactivée et fraîcheur remise à +30 jours. */
export async function republishPropertyAction(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse(formData.get("propertyId"));
  if (!parsed.success) return;

  const property = await requireOwnProperty(parsed.data);

  await prisma.property.update({
    where: { id: property.id },
    data: {
      status: "ACTIVE",
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + LISTING_LIFETIME_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  revalidatePath("/dashboard/annonces");
}

export type PhotoFormState = { error?: string; success?: string } | undefined;

/** Ajout de photos uploadées (validées : MIME + magic bytes + taille). */
export async function addPhotosAction(
  _prev: PhotoFormState,
  formData: FormData
): Promise<PhotoFormState> {
  const fr = await getT();
  const user = await requireLister();

  const parsedId = idSchema.safeParse(formData.get("propertyId"));
  if (!parsedId.success) return { error: fr.common.erreurInconnue };
  const property = await requireOwnProperty(parsedId.data);

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: fr.annonceForm.erreurUpload };

  const existingCount = await prisma.photo.count({
    where: { propertyId: property.id },
  });
  if (existingCount + files.length > MAX_PHOTOS_PER_PROPERTY) {
    return { error: fr.annonceForm.maxPhotos(MAX_PHOTOS_PER_PROPERTY) };
  }

  const urls: string[] = [];
  for (const file of files) {
    const url = await saveUploadedImage(file);
    if (!url) return { error: fr.annonceForm.erreurUpload };
    urls.push(url);
  }

  await prisma.photo.createMany({
    data: urls.map((url, i) => ({
      propertyId: property.id,
      url,
      alt: `${property.title} — photo ${existingCount + i + 1}`,
      position: existingCount + i,
    })),
  });

  await logAudit({
    action: "PHOTO_ADDED",
    userId: user.id,
    success: true,
    metadata: { propertyId: property.id, count: urls.length },
  });

  revalidatePath(`/dashboard/annonces/${property.id}/modifier`);
  revalidatePath(`/annonce/${property.slug}`);
  return { success: fr.annonceForm.photosAjoutees };
}

/** Suppression d'une photo (fichier uploadé effacé du disque, best-effort). */
export async function deletePhotoAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(formData.get("photoId"));
  if (!parsed.success) return;

  const photo = await prisma.photo.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      url: true,
      property: { select: { id: true, slug: true, ownerId: true } },
    },
  });
  // Autorisation : seul le propriétaire de l'annonce supprime ses photos.
  if (!photo || photo.property.ownerId !== user.id) return;

  await prisma.photo.delete({ where: { id: photo.id } });
  await deleteUploadedImage(photo.url);

  await logAudit({
    action: "PHOTO_DELETED",
    userId: user.id,
    success: true,
    metadata: { propertyId: photo.property.id, photoId: photo.id },
  });

  revalidatePath(`/dashboard/annonces/${photo.property.id}/modifier`);
  revalidatePath(`/annonce/${photo.property.slug}`);
}

/** Place une photo en couverture (position 0, les autres décalées). */
export async function setCoverPhotoAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(formData.get("photoId"));
  if (!parsed.success) return;

  const photo = await prisma.photo.findUnique({
    where: { id: parsed.data },
    select: { id: true, property: { select: { id: true, slug: true, ownerId: true } } },
  });
  if (!photo || photo.property.ownerId !== user.id) return;

  const photos = await prisma.photo.findMany({
    where: { propertyId: photo.property.id },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  const reordered = [photo.id, ...photos.map((p) => p.id).filter((id) => id !== photo.id)];

  await prisma.$transaction(
    reordered.map((id, position) =>
      prisma.photo.update({ where: { id }, data: { position } })
    )
  );

  revalidatePath(`/dashboard/annonces/${photo.property.id}/modifier`);
  revalidatePath(`/annonce/${photo.property.slug}`);
}

/** Favori (cœur) sur une annonce — bascule ajout/retrait. */
export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(formData.get("propertyId"));
  if (!parsed.success) return;

  const existing = await prisma.favorite.findUnique({
    where: { userId_propertyId: { userId: user.id, propertyId: parsed.data } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({
      data: { userId: user.id, propertyId: parsed.data },
    });
  }
  revalidatePath("/dashboard/favoris");

  const path = formData.get("path");
  if (typeof path === "string" && /^\/annonce\/[a-z0-9-]+$/.test(path)) {
    revalidatePath(path);
  }
}
