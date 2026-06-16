import { PrismaClient } from "@prisma/client";

// Filet de sécurité boot : si DIRECT_URL n'est pas défini (pas de pooler, ex.
// démo locale), on le fait retomber sur DATABASE_URL pour que l'app démarre
// sans config supplémentaire. Le moteur de migration (CLI `prisma`, autre
// process) lit DIRECT_URL depuis `.env` — voir .env.example.
process.env.DIRECT_URL ||= process.env.DATABASE_URL;

// Singleton Prisma — évite l'épuisement des connexions en dev (HMR). En prod
// le dimensionnement du pool passe par les paramètres de DATABASE_URL
// (connection_limit / pool_timeout) côté pooler — cf. .env.example.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Pas de log de requêtes (bruit + risque de fuite) ; on garde warn/error
    // pour la supervision (slow queries, pool saturé…). Brique d'observabilité.
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
