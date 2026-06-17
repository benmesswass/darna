-- B4 : marquage explicite des réservations confirmées via paiement SIMULÉ.
-- Colonne additive, NON NULL avec défaut → aucune réécriture des lignes existantes,
-- aucune rupture de compatibilité (les lectures actuelles ignorent la colonne).
ALTER TABLE "Booking" ADD COLUMN "demo" BOOLEAN NOT NULL DEFAULT false;
