-- Migration de rattrapage : réconcilie l'historique migratoire avec schema.prisma.
-- Le schéma avait dérivé via `prisma db push` (colonnes/table ajoutées hors
-- migration). Sans ce rattrapage, un `prisma migrate deploy` sur une base neuve
-- (CI / prod / scaling) créait une base SANS ces objets → crash runtime
-- (paiement, favoris-dossiers, mise en avant, légendes photo, avatar).

-- AlterTable
ALTER TABLE "Availability" ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentRef" TEXT;

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "folderId" TEXT;

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "caption" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "featuredUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT;

-- CreateTable
CREATE TABLE "FavoriteFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FavoriteFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FavoriteFolder_userId_idx" ON "FavoriteFolder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_paymentRef_key" ON "Booking"("paymentRef");

-- CreateIndex
CREATE INDEX "Favorite_folderId_idx" ON "Favorite"("folderId");

-- CreateIndex
CREATE INDEX "Property_featuredUntil_idx" ON "Property"("featuredUntil");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "FavoriteFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteFolder" ADD CONSTRAINT "FavoriteFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
