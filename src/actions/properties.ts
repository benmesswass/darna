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
import { FEATURED_DURATION_DAYS, LISTING_LIFETIME_DAYS } from "@/lib/config";
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
    address: z.string().trim().max(200).optional().or(z.literal("")),
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

/**
 * Mise à la une (paiement simulé) : le boost « à la une » est activé pour
 * FEATURED_DURATION_DAYS jours. Un nouvel achat alors qu'un boost est encore
 * actif le PROLONGE (cumul à partir de la date de fin restante).
 *
 * Le paiement est un mock assumé (même esprit que le séquestre des séjours) :
 * aucune intégration de paiement réel, mais l'autorisation et l'effet métier
 * sont, eux, bien réels et vérifiés côté serveur.
 */
export async function featureListingAction(formData: FormData): Promise<void> {
  const user = await requireLister();

  const parsed = idSchema.safeParse(formData.get("propertyId"));
  if (!parsed.success) return;

  // Autorisation : l'annonce doit appartenir à l'hôte connecté.
  await requireOwnProperty(parsed.data);

  // On relit le statut/expiration en base (jamais confiance au client) :
  // seule une annonce ACTIVE et non expirée peut être mise à la une.
  const property = await prisma.property.findUnique({
    where: { id: parsed.data },
    select: { id: true, slug: true, status: true, expiresAt: true, featuredUntil: true },
  });
  if (!property || property.status !== "ACTIVE" || property.expiresAt.getTime() < Date.now()) {
    return;
  }

  const boostMs = FEATURED_DURATION_DAYS * 24 * 60 * 60 * 1000;
  // Prolongation : on part de la fin de boost restante si elle est future.
  const base =
    property.featuredUntil && property.featuredUntil.getTime() > Date.now()
      ? property.featuredUntil.getTime()
      : Date.now();
  const featuredUntil = new Date(base + boostMs);

  await prisma.property.update({
    where: { id: property.id },
    data: { featuredUntil },
  });

  await logAudit({
    action: "PROPERTY_FEATURED",
    userId: user.id,
    success: true,
    metadata: { propertyId: property.id, featuredUntil: featuredUntil.toISOString() },
  });

  revalidatePath("/dashboard/annonces");
  revalidatePath(`/annonce/${property.slug}`);
  revalidatePath("/");
  redirect("/dashboard/annonces?alaune=1");
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

const captionSchema = z.object({
  photoId: z.string().min(1),
  // Légende courte et contextuelle ; vide = on efface la légende.
  caption: z.string().trim().max(140),
});

/** Met à jour la légende contextuelle d'une photo (overlay galerie). */
export async function updatePhotoCaptionAction(
  _prev: PhotoFormState,
  formData: FormData
): Promise<PhotoFormState> {
  const fr = await getT();
  const user = await requireUser();

  const parsed = captionSchema.safeParse({
    photoId: formData.get("photoId"),
    caption: formData.get("caption") ?? "",
  });
  if (!parsed.success) return { error: fr.common.erreurInconnue };

  const photo = await prisma.photo.findUnique({
    where: { id: parsed.data.photoId },
    select: { id: true, property: { select: { id: true, slug: true, ownerId: true } } },
  });
  // Autorisation : seul le propriétaire de l'annonce édite ses légendes.
  if (!photo || photo.property.ownerId !== user.id) {
    return { error: fr.common.erreurInconnue };
  }

  await prisma.photo.update({
    where: { id: photo.id },
    data: { caption: parsed.data.caption || null },
  });

  revalidatePath(`/dashboard/annonces/${photo.property.id}/modifier`);
  revalidatePath(`/annonce/${photo.property.slug}`);
  return { success: fr.annonceForm.legendeEnregistree };
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

// ── Disponibilités : blocage de dates par l'hôte ─────────────────────────────

export type BlockDatesFormState = { error?: string; success?: string } | undefined;

const DAY_MS = 24 * 60 * 60 * 1000;

const blockDatesSchema = z.object({
  propertyId: z.string().cuid(),
  // Arrivée (premier jour bloqué) et départ (exclusif, jour de nouveau libre),
  // en jour civil YYYY-MM-DD — même modèle que les réservations.
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Note privée facultative (aide-mémoire de l'hôte, jamais montrée au voyageur).
  reason: z.string().trim().max(120).optional(),
});

/**
 * Bloque une période de dates pour une annonce (séjour perso, travaux…). Les
 * nuits bloquées deviennent indisponibles à la réservation — elles sont déjà
 * prises en compte par le calendrier, le devis et l'anti-conflit (modèle
 * `Availability`).
 *
 * Bornes arrivée → départ EXCLUSIF, comme une réservation : on stocke
 * `startDate`/`endDate` tels quels (`checkIn < endDate && checkOut > startDate`,
 * itération `[start, end)`).
 */
export async function blockDatesAction(
  _prev: BlockDatesFormState,
  formData: FormData
): Promise<BlockDatesFormState> {
  const fr = await getT();
  const parsed = blockDatesSchema.safeParse({
    propertyId: formData.get("propertyId"),
    start: formData.get("start"),
    end: formData.get("end"),
    reason: (formData.get("reason") as string) || undefined,
  });
  if (!parsed.success) return { error: fr.annonceForm.blocageDatesInvalides };

  // Autorisation serveur : l'annonce doit appartenir à l'utilisateur connecté.
  const property = await requireOwnProperty(parsed.data.propertyId).catch(() => null);
  if (!property) return { error: fr.common.erreurInconnue };
  // Le blocage n'a de sens que pour un séjour (seul type réservable).
  if (property.type !== "SEJOUR") return { error: fr.common.erreurInconnue };

  const startDate = new Date(`${parsed.data.start}T00:00:00.000Z`);
  const endDate = new Date(`${parsed.data.end}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const nights = Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    nights < 1 ||
    nights > 365 ||
    startDate < today
  ) {
    return { error: fr.annonceForm.blocageDatesInvalides };
  }

  // On ne bloque pas une période déjà réservée par un voyageur (réservation
  // confirmée, ou hold en attente encore vivant).
  const conflict = await prisma.booking.findFirst({
    where: {
      propertyId: property.id,
      checkIn: { lt: endDate },
      checkOut: { gt: startDate },
      OR: [
        { status: "CONFIRMEE" },
        { status: "EN_ATTENTE", expiresAt: { gt: new Date() } },
      ],
    },
    select: { id: true },
  });
  if (conflict) return { error: fr.annonceForm.blocageConflitReservation };

  await prisma.availability.create({
    data: { propertyId: property.id, startDate, endDate, reason: parsed.data.reason || null },
  });

  await logAudit({
    action: "AVAILABILITY_BLOCKED",
    userId: property.ownerId,
    success: true,
    metadata: { propertyId: property.id, start: parsed.data.start, end: parsed.data.end },
  });

  revalidatePath(`/dashboard/annonces/${property.id}/modifier`);
  revalidatePath(`/annonce/${property.slug}`);
  revalidatePath(`/annonce/${property.slug}/reserver`);
  return { success: fr.annonceForm.blocageAjoute };
}

/** Retire un blocage de dates (idempotent ; ne touche jamais aux réservations). */
export async function unblockDatesAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(formData.get("availabilityId"));
  if (!parsed.success) return;

  const block = await prisma.availability.findUnique({
    where: { id: parsed.data },
    select: { id: true, property: { select: { id: true, slug: true, ownerId: true } } },
  });
  if (!block || block.property.ownerId !== user.id) return;

  await prisma.availability.delete({ where: { id: block.id } });

  await logAudit({
    action: "AVAILABILITY_UNBLOCKED",
    userId: user.id,
    success: true,
    metadata: { availabilityId: block.id, propertyId: block.property.id },
  });

  revalidatePath(`/dashboard/annonces/${block.property.id}/modifier`);
  revalidatePath(`/annonce/${block.property.slug}`);
  revalidatePath(`/annonce/${block.property.slug}/reserver`);
}

// Nom de dossier de favoris : libre, non vide, borné. La suggestion par
// défaut « Ville, Mois Année » est calculée côté client (locale-aware).
const folderNameSchema = z.string().trim().min(1).max(80);

/**
 * Retire un logement des favoris — appelé au clic sur le cœur déjà rempli.
 * deleteMany (et non delete) : idempotent, aucune erreur si déjà absent.
 */
export async function removeFavoriteAction(propertyId: string): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(propertyId);
  if (!parsed.success) return;

  await prisma.favorite.deleteMany({
    where: { userId: user.id, propertyId: parsed.data },
  });
  revalidatePath("/dashboard/favoris");
}

/**
 * Enregistre un logement dans un dossier existant (folderId), ou « Sans
 * dossier » (folderId null). upsert → réutilisable pour DÉPLACER un favori
 * déjà présent vers un autre dossier. Le dossier ciblé doit appartenir au user.
 */
export async function addFavoriteAction(
  propertyId: string,
  folderId: string | null
): Promise<void> {
  const user = await requireUser();
  const pid = idSchema.safeParse(propertyId);
  if (!pid.success) return;

  let resolvedFolderId: string | null = null;
  if (folderId) {
    const fid = idSchema.safeParse(folderId);
    if (!fid.success) return;
    // Autorisation : jamais confiance au client — le dossier doit être le sien.
    const folder = await prisma.favoriteFolder.findFirst({
      where: { id: fid.data, userId: user.id },
      select: { id: true },
    });
    if (!folder) return;
    resolvedFolderId = folder.id;
  }

  await prisma.favorite.upsert({
    where: { userId_propertyId: { userId: user.id, propertyId: pid.data } },
    create: { userId: user.id, propertyId: pid.data, folderId: resolvedFolderId },
    update: { folderId: resolvedFolderId },
  });
  revalidatePath("/dashboard/favoris");
}

/**
 * Crée un nouveau dossier (nom fourni par l'utilisateur, déjà pré-rempli
 * « Ville, Mois Année » côté client) PUIS y enregistre le logement — en une
 * transaction pour ne jamais laisser un dossier orphelin si l'ajout échoue.
 */
export async function createFolderWithFavoriteAction(
  propertyId: string,
  name: string
): Promise<{ folderId: string } | null> {
  const user = await requireUser();
  const pid = idSchema.safeParse(propertyId);
  const parsedName = folderNameSchema.safeParse(name);
  if (!pid.success || !parsedName.success) return null;

  const folder = await prisma.$transaction(async (tx) => {
    const created = await tx.favoriteFolder.create({
      data: { userId: user.id, name: parsedName.data },
    });
    await tx.favorite.upsert({
      where: { userId_propertyId: { userId: user.id, propertyId: pid.data } },
      create: { userId: user.id, propertyId: pid.data, folderId: created.id },
      update: { folderId: created.id },
    });
    return created;
  });
  revalidatePath("/dashboard/favoris");
  return { folderId: folder.id };
}

/** Renomme un dossier de favoris (propriété vérifiée côté serveur). */
export async function renameFolderAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const fid = idSchema.safeParse(formData.get("folderId"));
  const parsedName = folderNameSchema.safeParse(formData.get("name"));
  if (!fid.success || !parsedName.success) return;

  await prisma.favoriteFolder.updateMany({
    where: { id: fid.data, userId: user.id },
    data: { name: parsedName.data },
  });
  revalidatePath("/dashboard/favoris");
}

/**
 * Supprime un dossier. Ses favoris ne sont PAS supprimés : ils repassent
 * « Sans dossier » (Favorite.folderId → null via onDelete: SetNull au schéma).
 */
export async function deleteFolderAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const fid = idSchema.safeParse(formData.get("folderId"));
  if (!fid.success) return;

  await prisma.favoriteFolder.deleteMany({
    where: { id: fid.data, userId: user.id },
  });
  revalidatePath("/dashboard/favoris");
}
