-- Suspension progressive : durée temporaire croissante (suspendedUntil) et
-- compteur de suspensions (suspensionCount) pour le palier de durée.
ALTER TABLE "User" ADD COLUMN "suspendedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "suspensionCount" INTEGER NOT NULL DEFAULT 0;
