-- Suspension anti-bypass : compte bloqué (réservation + messagerie) au-delà du
-- seuil de tentatives de partage de coordonnées hors plateforme.
ALTER TABLE "User" ADD COLUMN "suspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3);
