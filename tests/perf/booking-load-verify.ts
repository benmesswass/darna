/**
 * Vérifie l'invariant après la charge (k6 ne peut pas parler à Prisma) :
 * exactement UNE réservation active sur le créneau raced, puis nettoie les
 * données seedées par booking-load-setup.ts.
 */
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../../src/lib/prisma";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contextPath = join(__dirname, ".booking-load-context.json");

async function main() {
  if (!existsSync(contextPath)) {
    throw new Error("Contexte introuvable — booking-load-setup.ts a-t-il tourné ?");
  }
  const ctx = JSON.parse(readFileSync(contextPath, "utf8"));

  const property = await prisma.property.findUniqueOrThrow({ where: { slug: ctx.slug } });
  const activeBookings = await prisma.booking.findMany({
    where: {
      propertyId: property.id,
      checkIn: new Date(ctx.checkIn),
      checkOut: new Date(ctx.checkOut),
      status: { not: "ANNULEE" },
    },
  });

  console.log(`Réservations actives sur le créneau raced : ${activeBookings.length}`);

  await prisma.booking.deleteMany({ where: { guest: { id: { startsWith: ctx.prefix } } } });
  await prisma.property.deleteMany({ where: { slug: { startsWith: ctx.prefix } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: ctx.prefix } } });
  rmSync(contextPath, { force: true });

  if (activeBookings.length !== 1) {
    throw new Error(`ÉCHEC — attendu exactement 1 réservation active, trouvé ${activeBookings.length}.`);
  }
  console.log("OK — aucune double-réservation sous charge concurrente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
