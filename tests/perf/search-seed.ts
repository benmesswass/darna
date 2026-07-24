/**
 * Peuple des annonces réalistes avant le test de charge sur /sejours
 * (tests/perf/search.js) — une base vide donnerait un p95 artificiellement
 * optimiste. Idempotent : nettoie par préfixe avant de re-seeder (rejouable
 * en local sans collision de slug ; en CI la base est de toute façon
 * éphémère par run).
 */
import bcrypt from "bcryptjs";
import { prisma } from "../../src/lib/prisma";

const PREFIX = "perf-search-";
const CITIES: Array<[string, string, number, number]> = [
  ["Hammamet", "Nabeul", 36.4, 10.61],
  ["Tunis", "Tunis", 36.8, 10.18],
  ["Sousse", "Sousse", 35.83, 10.64],
  ["Djerba", "Médenine", 33.8, 10.85],
];

async function main() {
  await prisma.property.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: PREFIX } } });

  const passwordHash = await bcrypt.hash("x", 4);
  const owner = await prisma.user.create({
    data: {
      id: `${PREFIX}owner`,
      email: `${PREFIX}owner@darna.tn`,
      passwordHash,
      name: "perf search owner",
      role: "HOTE",
      emailVerified: true,
      phoneVerified: true,
      kycStatus: "VERIFIE",
    },
  });

  const COUNT = 40;
  for (let i = 0; i < COUNT; i++) {
    const [city, gouvernorat, lat, lon] = CITIES[i % CITIES.length];
    await prisma.property.create({
      data: {
        slug: `${PREFIX}stay-${i}`,
        title: `Séjour test perf ${i}`,
        description: "Annonce de test — charge sur la recherche.",
        type: "SEJOUR",
        vertical: "STAY",
        status: "ACTIVE",
        price: 100 + (i % 10) * 50,
        city,
        gouvernorat,
        latitude: lat,
        longitude: lon,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        ownerId: owner.id,
        stay: { create: { maxGuests: 4, kind: "APPARTEMENT" } },
      },
    });
  }

  console.log(`${COUNT} annonces seedées pour le test de charge recherche.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
