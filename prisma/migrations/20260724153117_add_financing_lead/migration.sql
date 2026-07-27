-- CreateTable
CREATE TABLE "FinancingLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "desiredAmount" INTEGER,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyId" TEXT NOT NULL,
    "senderId" TEXT,

    CONSTRAINT "FinancingLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancingLead_propertyId_idx" ON "FinancingLead"("propertyId");

-- CreateIndex
CREATE INDEX "FinancingLead_createdAt_idx" ON "FinancingLead"("createdAt");

-- AddForeignKey
ALTER TABLE "FinancingLead" ADD CONSTRAINT "FinancingLead_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingLead" ADD CONSTRAINT "FinancingLead_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
