-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "paymentRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paymentRef_key" ON "Subscription"("paymentRef");
