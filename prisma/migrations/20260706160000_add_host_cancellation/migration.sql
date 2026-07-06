-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancelledByHostAt" TIMESTAMP(3),
ADD COLUMN     "hostCancelBlockDays" INTEGER;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "cancelBlockedUntil" TIMESTAMP(3);
