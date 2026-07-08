import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { chromium, type FullConfig } from "@playwright/test";
import { prisma } from "../../src/lib/prisma";
import { E2E_PASSWORD, E2E_PREFIX, E2E_PROPERTY_SLUGS, E2E_USERS } from "./seed-data";

const DAY = 24 * 60 * 60 * 1000;
const AUTH_DIR = path.join(__dirname, ".auth");

function addDays(offset: number): Date {
  return new Date(Date.now() + offset * DAY);
}

/**
 * Nettoyage FK-safe des données d'un run précédent (idempotent). Basé sur le
 * préfixe e-mail (pas l'id) : capture aussi bien les comptes fixes seedés ici
 * que ceux créés DYNAMIQUEMENT par les specs (inscription 01, hôte KYC 07),
 * tant qu'ils utilisent une adresse `e2e-*@...` (convention appliquée dans
 * tous les specs qui enregistrent un compte).
 */
async function cleanup(): Promise<void> {
  await prisma.booking.deleteMany({
    where: {
      OR: [
        { guest: { email: { startsWith: E2E_PREFIX } } },
        { property: { owner: { email: { startsWith: E2E_PREFIX } } } },
      ],
    },
  });
  await prisma.property.deleteMany({ where: { owner: { email: { startsWith: E2E_PREFIX } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: E2E_PREFIX } } });
}

async function seedUsers(): Promise<void> {
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 12);
  for (const u of Object.values(E2E_USERS)) {
    await prisma.user.create({
      data: {
        id: u.id,
        email: u.email,
        passwordHash,
        name: u.id,
        role: u.role,
        emailVerified: true,
        phoneVerified: true,
        kycStatus: "VERIFIE",
      },
    });
  }
}

async function seedProperty(slug: string, ownerId: string, overrides: { cashPaymentEnabled?: boolean } = {}) {
  return prisma.property.create({
    data: {
      slug,
      title: "E2E Test Stay",
      description: "Annonce de test E2E — ne pas réserver manuellement.",
      type: "SEJOUR",
      vertical: "STAY",
      status: "ACTIVE",
      price: 200,
      city: "Hammamet",
      gouvernorat: "Nabeul",
      latitude: 36.4,
      longitude: 10.61,
      expiresAt: addDays(90),
      ownerId,
      cashPaymentEnabled: overrides.cashPaymentEnabled ?? false,
      cashTermsAcceptedAt: overrides.cashPaymentEnabled ? new Date() : null,
      stay: { create: { maxGuests: 6, kind: "APPARTEMENT" } },
    },
    select: { id: true, slug: true },
  });
}

async function seedProperties(): Promise<void> {
  await seedProperty(E2E_PROPERTY_SLUGS.booking, E2E_USERS.host.id);
  await seedProperty(E2E_PROPERTY_SLUGS.double, E2E_USERS.host.id);
  const cash = await seedProperty(E2E_PROPERTY_SLUGS.cash, E2E_USERS.host.id, { cashPaymentEnabled: true });
  const idor = await seedProperty(E2E_PROPERTY_SLUGS.idor, E2E_USERS.host.id);
  // Propriétaire DÉDIÉ (hostCancel) : ce scénario suspend l'hôte qui annule —
  // isolé du `host` partagé par les autres scénarios (cf. seed-data.ts).
  const cancel = await seedProperty(E2E_PROPERTY_SLUGS.cancel, E2E_USERS.hostCancel.id);

  // Réservation pré-existante de traveler-a — cible du scénario IDOR (traveler-b
  // tente d'ouvrir sa page de paiement).
  await prisma.booking.create({
    data: {
      propertyId: idor.id,
      guestId: E2E_USERS.travelerA.id,
      checkIn: addDays(15),
      checkOut: addDays(17),
      nightlyPrice: 200,
      serviceFee: 20,
      totalPrice: 420,
      amountPaid: 420,
      status: "CONFIRMEE",
      escrow: "EN_SEQUESTRE",
      paidAt: new Date(),
    },
  });

  // Réservation CONFIRMEE de traveler-a — cible du scénario annulation hôte.
  await prisma.booking.create({
    data: {
      propertyId: cancel.id,
      guestId: E2E_USERS.travelerA.id,
      checkIn: addDays(20),
      checkOut: addDays(22),
      nightlyPrice: 200,
      serviceFee: 20,
      totalPrice: 420,
      amountPaid: 420,
      status: "CONFIRMEE",
      escrow: "EN_SEQUESTRE",
      paidAt: new Date(),
    },
  });

  // Demande de paiement sur place déjà déposée — séjour "en cours" : checkIn
  // au passé (nécessaire pour le no-show, impossible à sélectionner dans le
  // calendrier UI qui bloque les dates passées) MAIS checkOut au futur, sinon
  // `completeElapsedBookings()` (dashboard/reservations/page.tsx) bascule la
  // réservation en TERMINEE avant même le clic — le bouton no-show exige
  // status === "CONFIRMEE". Guest jetable dédié.
  await prisma.booking.create({
    data: {
      propertyId: cash.id,
      guestId: E2E_USERS.travelerNoShow.id,
      checkIn: new Date(Date.now() - 1 * DAY),
      checkOut: new Date(Date.now() + 1 * DAY),
      nightlyPrice: 200,
      serviceFee: 20,
      totalPrice: 420,
      status: "EN_ATTENTE_ACCEPTATION",
      paymentMode: "SUR_PLACE",
      expiresAt: addDays(2),
    },
  });
}

/**
 * Connexion réelle via l'UI (pas de raccourci NextAuth interne) → storageState.
 *
 * `fakeIp` : le rate-limit "connexion" (src/lib/rate-limit.ts) est en mémoire,
 * partagé par IP sur tout le process `next dev` — sans isolation, ces
 * connexions de seed consommeraient une partie du quota (5/15 min) AVANT même
 * que le scénario 01 (qui teste explicitement ce rate-limit) ne démarre. En
 * mode non-production le code lit `x-forwarded-for` en confiance (pas de
 * frontière de sécurité en dev) : on attribue une IP factice dédiée par rôle
 * pour que chaque bucket parte de zéro, sans toucher au code applicatif.
 */
async function saveStorageState(
  baseURL: string,
  email: string,
  file: string,
  fakeIp: string
): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL,
    extraHTTPHeaders: { "x-forwarded-for": fakeIp },
  });
  const page = await context.newPage();
  await page.goto("/connexion");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(E2E_PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/connexion"));
  await context.storageState({ path: path.join(AUTH_DIR, file) });
  await browser.close();
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL requis pour seeder les données E2E.");
  }
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await cleanup();
  await seedUsers();
  await seedProperties();

  // travelerNoShow n'est jamais piloté directement par un test : pas de login.
  await saveStorageState(baseURL, E2E_USERS.host.email, "host.json", "10.0.0.11");
  await saveStorageState(baseURL, E2E_USERS.hostCancel.email, "host-cancel.json", "10.0.0.12");
  await saveStorageState(baseURL, E2E_USERS.travelerA.email, "traveler-a.json", "10.0.0.13");
  await saveStorageState(baseURL, E2E_USERS.travelerB.email, "traveler-b.json", "10.0.0.14");

  await prisma.$disconnect();
}
