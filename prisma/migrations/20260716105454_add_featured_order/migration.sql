-- CreateTable
CREATE TABLE "FeaturedOrder" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "paymentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "FeaturedOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedOrder_paymentRef_key" ON "FeaturedOrder"("paymentRef");

-- CreateIndex
CREATE INDEX "FeaturedOrder_ownerId_status_idx" ON "FeaturedOrder"("ownerId", "status");

-- CreateIndex
CREATE INDEX "FeaturedOrder_propertyId_status_idx" ON "FeaturedOrder"("propertyId", "status");

-- AddForeignKey
ALTER TABLE "FeaturedOrder" ADD CONSTRAINT "FeaturedOrder_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedOrder" ADD CONSTRAINT "FeaturedOrder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
