-- Politique d'annulation sur l'annonce + champs d'annulation sur la réservation.
-- cancelPolicy : FLEXIBLE (24h) | MODEREE (7j, défaut) | STRICTE (14j / 50 %).
-- cancelledAt + refundAmount : figés au moment de l'annulation par l'action serveur.

-- AlterTable Property
ALTER TABLE "Property" ADD COLUMN "cancelPolicy" TEXT NOT NULL DEFAULT 'MODEREE';

-- AlterTable Booking
ALTER TABLE "Booking" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "refundAmount" INTEGER;
