-- Backfill StayDetails depuis Property.maxGuests (M2, NON destructif).
-- Property.maxGuests reste en colonne *shadow* (encore écrite) jusqu'à PR8 ;
-- les lectures séjour basculent sur StayDetails dans cette PR.
-- Idempotent (ON CONFLICT) : rejouable sans dupliquer. Sur une base fraîche
-- (CI) Property est vide → no-op ; c'est sur les données existantes que ça agit.
INSERT INTO "StayDetails" ("propertyId", "maxGuests")
SELECT "id", "maxGuests"
FROM "Property"
WHERE "type" = 'SEJOUR' AND "maxGuests" IS NOT NULL
ON CONFLICT ("propertyId") DO NOTHING;
