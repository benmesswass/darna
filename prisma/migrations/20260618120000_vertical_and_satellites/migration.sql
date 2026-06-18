-- Verticales + tables satellites (M1, NON destructif).
-- Stratégie sûre pour `vertical` : ajout nullable → backfill depuis `type` →
-- passage NOT NULL. Aucune lecture nouvelle n'en dépend encore (cf. roadmap).

-- AlterTable: ajout de `vertical` (nullable le temps du backfill)
ALTER TABLE "Property" ADD COLUMN "vertical" TEXT;

-- Backfill: SEJOUR → STAY ; LOCATION/VENTE → IMMO (cf. src/lib/constants.ts)
UPDATE "Property"
SET "vertical" = CASE WHEN "type" = 'SEJOUR' THEN 'STAY' ELSE 'IMMO' END
WHERE "vertical" IS NULL;

-- Enforce: la colonne devient obligatoire une fois toutes les lignes backfillées
ALTER TABLE "Property" ALTER COLUMN "vertical" SET NOT NULL;

-- CreateIndex: listing + gating par verticale
CREATE INDEX "Property_vertical_status_expiresAt_idx" ON "Property"("vertical", "status", "expiresAt");

-- CreateTable: détails séjour (1:1, vide)
CREATE TABLE "StayDetails" (
    "propertyId" TEXT NOT NULL,
    "maxGuests" INTEGER NOT NULL,

    CONSTRAINT "StayDetails_pkey" PRIMARY KEY ("propertyId")
);

-- CreateTable: détails immo (1:1, vide)
CREATE TABLE "ImmoDetails" (
    "propertyId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "condition" TEXT,
    "floor" INTEGER,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "charges" INTEGER,
    "landBuildable" BOOLEAN,
    "dpe" TEXT,

    CONSTRAINT "ImmoDetails_pkey" PRIMARY KEY ("propertyId")
);

-- AddForeignKey
ALTER TABLE "StayDetails" ADD CONSTRAINT "StayDetails_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImmoDetails" ADD CONSTRAINT "ImmoDetails_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
