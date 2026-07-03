-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentMode" TEXT NOT NULL DEFAULT 'ESCROW';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "cashPaymentEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cashTermsAcceptedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "HostInvoice" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "paymentRef" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,

    CONSTRAINT "HostInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HostInvoice_paymentRef_key" ON "HostInvoice"("paymentRef");

-- CreateIndex
CREATE UNIQUE INDEX "HostInvoice_bookingId_key" ON "HostInvoice"("bookingId");

-- CreateIndex
CREATE INDEX "HostInvoice_hostId_status_idx" ON "HostInvoice"("hostId", "status");

-- CreateIndex
CREATE INDEX "HostInvoice_status_dueAt_idx" ON "HostInvoice"("status", "dueAt");

-- AddForeignKey
ALTER TABLE "HostInvoice" ADD CONSTRAINT "HostInvoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostInvoice" ADD CONSTRAINT "HostInvoice_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
