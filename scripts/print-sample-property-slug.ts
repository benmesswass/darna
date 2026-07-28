/**
 * Imprime le slug d'une annonce séjour active du seed principal, sur stdout
 * (rien d'autre) — utilisé par le job Lighthouse (nightly.yml, §L9.3) pour
 * auditer une vraie page annonce sans dépendre d'un slug deviné/codé en dur.
 * Lancement : npx tsx scripts/print-sample-property-slug.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.findFirst({
    where: { status: "ACTIVE", vertical: "STAY" },
    orderBy: { id: "asc" },
    select: { slug: true },
  });
  if (!property) {
    console.error("Aucune annonce séjour active trouvée — le seed a-t-il tourné ?");
    process.exit(1);
  }
  process.stdout.write(property.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
