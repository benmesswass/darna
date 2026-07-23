-- CreateTable
CREATE TABLE "VerificationWallet" (
    "id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VerificationWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCreditOrder" (
    "id" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "paymentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "VerificationCreditOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationWallet_userId_key" ON "VerificationWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCreditOrder_paymentRef_key" ON "VerificationCreditOrder"("paymentRef");

-- CreateIndex
CREATE INDEX "VerificationCreditOrder_ownerId_status_idx" ON "VerificationCreditOrder"("ownerId", "status");

-- AddForeignKey
ALTER TABLE "VerificationWallet" ADD CONSTRAINT "VerificationWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCreditOrder" ADD CONSTRAINT "VerificationCreditOrder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
