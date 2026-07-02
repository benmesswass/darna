-- Sous-notes d'avis (F2) : propreté, communication, conformité, rapport
-- qualité/prix. Colonnes ajoutées nullable, backfillées depuis la note
-- globale existante (seule donnée disponible pour l'historique — no-op sur
-- une base neuve), puis rendues obligatoires (même pattern que
-- property_rating_aggregates).
ALTER TABLE "Review" ADD COLUMN "proprete" INTEGER;
ALTER TABLE "Review" ADD COLUMN "communication" INTEGER;
ALTER TABLE "Review" ADD COLUMN "conformite" INTEGER;
ALTER TABLE "Review" ADD COLUMN "qualitePrix" INTEGER;

UPDATE "Review"
SET "proprete" = "rating",
    "communication" = "rating",
    "conformite" = "rating",
    "qualitePrix" = "rating"
WHERE "proprete" IS NULL;

ALTER TABLE "Review" ALTER COLUMN "proprete" SET NOT NULL;
ALTER TABLE "Review" ALTER COLUMN "communication" SET NOT NULL;
ALTER TABLE "Review" ALTER COLUMN "conformite" SET NOT NULL;
ALTER TABLE "Review" ALTER COLUMN "qualitePrix" SET NOT NULL;
