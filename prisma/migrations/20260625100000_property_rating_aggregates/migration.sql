-- Agrégats d'avis dénormalisés sur Property : servent le tri « mieux / moins
-- notés » (Prisma ne sait pas trier par moyenne d'une relation, et le projet
-- s'interdit le SQL brut applicatif). Maintenus à chaque avis (submitReviewAction)
-- et au seed. Backfill ci-dessous pour les données existantes.

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "ratingAvg" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill depuis les avis existants (no-op sur une base neuve).
UPDATE "Property" p
SET "ratingCount" = sub.cnt,
    "ratingAvg" = sub.avg
FROM (
  SELECT "propertyId", COUNT(*)::int AS cnt, AVG("rating")::double precision AS avg
  FROM "Review"
  GROUP BY "propertyId"
) sub
WHERE p."id" = sub."propertyId";
