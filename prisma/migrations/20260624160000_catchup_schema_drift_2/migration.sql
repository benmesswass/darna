-- Migration de rattrapage #2 : réconcilie l'historique migratoire avec
-- schema.prisma. Plusieurs objets avaient été ajoutés via `prisma db push`
-- (hors migration) après le premier rattrapage (20260616120000) : sans cette
-- migration, un `prisma migrate deploy` sur une base NEUVE (CI / prod / reset /
-- scaling) crée une base SANS ces colonnes → crash runtime sur toute requête
-- connectée (session : User.emailVerified ; vérif e-mail : OtpChallenge.purpose ;
-- vérification d'annonce : Property.verified* ; back-office Wakil : WakilApplication.*).
-- SQL généré par `prisma migrate diff` (source de vérité).

-- DropIndex
DROP INDEX "OtpChallenge_userId_idx";

-- AlterTable
ALTER TABLE "OtpChallenge" ADD COLUMN     "purpose" TEXT NOT NULL DEFAULT 'KYC';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "verificationLevel" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT,
ALTER COLUMN "status" SET DEFAULT 'EN_ATTENTE_VALIDATION';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWakil" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WakilApplication" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "interviewAt" TIMESTAMP(3),
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "OtpChallenge_userId_purpose_idx" ON "OtpChallenge"("userId", "purpose");

-- CreateIndex
CREATE INDEX "WakilApplication_userId_idx" ON "WakilApplication"("userId");

-- CreateIndex
CREATE INDEX "WakilApplication_deletedAt_idx" ON "WakilApplication"("deletedAt");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WakilApplication" ADD CONSTRAINT "WakilApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WakilApplication" ADD CONSTRAINT "WakilApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
