/**
 * Helpers pour les tests d'INTÉGRATION sur une VRAIE base PostgreSQL
 * (TEST_AUTOMATION_ROADMAP §4.2, Phase 1).
 *
 * Contrairement aux tests unitaires (qui mockent `@/lib/prisma`), ces helpers
 * utilisent le vrai client Prisma pour prouver les invariants au niveau moteur
 * (transactions SERIALIZABLE, contraintes, concurrence). Ils NE doivent donc
 * jamais être importés dans un fichier qui mocke `@/lib/prisma`.
 *
 * Isolation : chaque exécution préfixe ses données d'un identifiant unique et
 * les nettoie via `cleanupByPrefix()` — on ne dépend jamais du seed ni de
 * l'ordre des tests, et on ne pollue pas une base partagée.
 */
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

/** Base joignable ? (CI : toujours ; local : uniquement si DATABASE_URL exporté) */
export const DB_ENABLED = Boolean(process.env.DATABASE_URL);

const DAY = 24 * 60 * 60 * 1000;

/** Jour civil UTC décalé de `offset` jours, format YYYY-MM-DD. */
export function ymd(offset: number): string {
  return new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);
}

/**
 * Objet utilisateur tel que `requireUser()` le renvoie — suffisant pour que
 * `createBookingAction` passe ses gardes (compte vérifié, non suspendu) tout en
 * pointant vers une VRAIE ligne User (FK `Booking.guestId`).
 */
export type FakeSessionUser = {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: string;
  suspended: boolean;
  suspendedUntil: Date | null;
};

/** Crée un utilisateur réel (voyageur vérifié par défaut) et renvoie l'objet session. */
export async function createUser(
  prefix: string,
  overrides: Partial<{ role: string; kycStatus: string }> = {}
): Promise<FakeSessionUser> {
  const id = `${prefix}-${randomUUID()}`;
  const email = `${id}@itest.darna.local`;
  const user = await prisma.user.create({
    data: {
      id,
      email,
      passwordHash: "x",
      name: "Integration Test User",
      role: overrides.role ?? "VOYAGEUR",
      emailVerified: true,
      phoneVerified: true,
      kycStatus: overrides.kycStatus ?? "VERIFIE",
    },
    select: { id: true, email: true, role: true },
  });
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: true,
    phoneVerified: true,
    kycStatus: overrides.kycStatus ?? "VERIFIE",
    suspended: false,
    suspendedUntil: null,
  };
}

/** Crée une annonce SÉJOUR ACTIVE réservable, propriété de `ownerId`. */
export async function createStayProperty(
  prefix: string,
  ownerId: string,
  overrides: Partial<{ price: number; maxGuests: number }> = {}
): Promise<{ id: string; slug: string }> {
  const slug = `${prefix}-${randomUUID()}`;
  const property = await prisma.property.create({
    data: {
      slug,
      title: "Integration Test Stay",
      description: "Annonce de test d'intégration.",
      type: "SEJOUR",
      vertical: "STAY",
      status: "ACTIVE",
      price: overrides.price ?? 200,
      city: "Hammamet",
      gouvernorat: "Nabeul",
      latitude: 36.4,
      longitude: 10.61,
      expiresAt: new Date(Date.now() + 30 * DAY),
      ownerId,
      stay: {
        create: { maxGuests: overrides.maxGuests ?? 6, kind: "APPARTEMENT" },
      },
    },
    select: { id: true, slug: true },
  });
  return property;
}

/**
 * Supprime toutes les données créées sous `prefix` (ordre FK-safe).
 * À appeler en `afterAll` pour laisser la base propre.
 */
export async function cleanupByPrefix(prefix: string): Promise<void> {
  await prisma.booking.deleteMany({ where: { guest: { id: { startsWith: prefix } } } });
  await prisma.property.deleteMany({ where: { slug: { startsWith: prefix } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: prefix } } });
}

/** Construit un FormData de réservation ESCROW pour `createBookingAction`. */
export function bookingFormData(
  slug: string,
  arrivee: string,
  depart: string,
  voyageurs = 2
): FormData {
  const fd = new FormData();
  fd.set("slug", slug);
  fd.set("arrivee", arrivee);
  fd.set("depart", depart);
  fd.set("voyageurs", String(voyageurs));
  return fd;
}
