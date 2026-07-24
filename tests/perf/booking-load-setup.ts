/**
 * Prépare la charge sur la fenêtre de réservation concurrente
 * (TEST_AUTOMATION_ROADMAP.md §6.7) : k6 ne peut pas parler à Prisma ni
 * piloter un navigateur (VM JS isolée, pas de Node) — ce script Node fait le
 * travail que k6 ne peut pas faire, puis écrit un contexte JSON que le
 * script k6 lit via `open()`.
 *
 * Technique validée par spike (2026-07-09) : l'id de Server Action
 * (`next-action`) capturé une fois via une vraie connexion UI reste valide
 * pour des appels HTTP bruts ultérieurs (testé jusqu'à 3 requêtes réelles,
 * dont une via curl sans navigateur) — pas besoin de rejouer tout un flux
 * Playwright par requête de charge.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { chromium } from "@playwright/test";
import { prisma } from "../../src/lib/prisma";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const PREFIX = `perf-booking-${Date.now()}`;
const PASSWORD = "perf-booking-load-password-2026";

async function seed() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const guest = await prisma.user.create({
    data: {
      id: `${PREFIX}-guest`,
      email: `${PREFIX}-guest@darna.tn`,
      passwordHash,
      name: "perf booking guest",
      role: "VOYAGEUR",
      emailVerified: true,
      phoneVerified: true,
      kycStatus: "VERIFIE",
    },
  });
  const owner = await prisma.user.create({
    data: {
      id: `${PREFIX}-owner`,
      email: `${PREFIX}-owner@darna.tn`,
      passwordHash,
      name: "perf booking owner",
      role: "HOTE",
      emailVerified: true,
      phoneVerified: true,
      kycStatus: "VERIFIE",
    },
  });
  const slug = `${PREFIX}-stay`;
  const property = await prisma.property.create({
    data: {
      slug,
      title: "perf booking load stay",
      description: "Charge — fenêtre de réservation concurrente (k6).",
      type: "SEJOUR",
      vertical: "STAY",
      status: "ACTIVE",
      price: 200,
      city: "Hammamet",
      gouvernorat: "Nabeul",
      latitude: 36.4,
      longitude: 10.61,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      ownerId: owner.id,
      stay: { create: { maxGuests: 6, kind: "APPARTEMENT" } },
    },
    select: { id: true, slug: true },
  });

  const checkIn = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const checkOut = new Date(Date.now() + 47 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return { guest, property, checkIn, checkOut };
}

/** Connexion réelle via l'UI (même technique que tests/e2e/global-setup.ts)
 * + découverte de l'id de Server Action via un appel réel (dates différentes
 * du créneau ciblé par la charge — cette capture crée une vraie réservation). */
async function login(email: string, slug: string, captureCheckIn: string, captureCheckOut: string) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  await page.goto("/connexion");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/connexion"));

  await page.goto(`/annonce/${slug}/reserver?arrivee=${captureCheckIn}&depart=${captureCheckOut}&voyageurs=1`);
  await page.waitForTimeout(1000); // laisser le devis serveur arriver

  let actionId: string | null = null;
  page.on("request", (req) => {
    const id = req.headers()["next-action"];
    if (req.method() === "POST" && id) actionId = id;
  });
  await page.locator('button[type="submit"]').filter({ hasText: /paiement|continuer/i }).click();
  await page.waitForTimeout(1000);

  const cookies = await context.cookies();
  const sessionCookie = cookies.find((c) => c.name === "authjs.session-token");
  if (!sessionCookie) throw new Error("Cookie de session introuvable après connexion.");
  if (!actionId) throw new Error("Id de Server Action introuvable — sélecteur de bouton à vérifier.");

  await browser.close();
  return { sessionCookie, actionId };
}

async function main() {
  const { guest, property, checkIn, checkOut } = await seed();

  // La capture crée une VRAIE réservation — créneau différent de celui ciblé
  // par la charge (encore libre).
  const captureCheckIn = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const captureCheckOut = new Date(Date.now() + 62 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { sessionCookie, actionId } = await login(guest.email, property.slug, captureCheckIn, captureCheckOut);

  mkdirSync(join(__dirname), { recursive: true });
  writeFileSync(
    join(__dirname, ".booking-load-context.json"),
    JSON.stringify(
      {
        prefix: PREFIX,
        baseUrl: BASE_URL,
        slug: property.slug,
        checkIn,
        checkOut,
        actionId,
        cookieName: sessionCookie.name,
        cookieValue: sessionCookie.value,
      },
      null,
      2
    )
  );

  console.log(`Contexte écrit — préfixe ${PREFIX}, créneau ciblé ${checkIn} → ${checkOut}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
