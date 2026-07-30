-- ROADMAP.md §P3.3 : versionnement des CGU hôte (paiement sur place). Les
-- annonces qui avaient déjà accepté (cashTermsAcceptedAt non nul) ont accepté
-- le texte ACTUEL des CGU hôte, c'est-à-dire la version 1 (CURRENT_CASH_TERMS_
-- VERSION, src/lib/config.ts) — backfill ci-dessous pour ne pas leur imposer
-- une ré-acceptation immédiate au prochain enregistrement (no-op sur une base
-- neuve). Une future version 2+ ne concernera, elle, que les VRAIS changements
-- de contenu.

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "cashTermsVersion" INTEGER;

-- Backfill : les acceptations déjà enregistrées valent pour la version 1.
UPDATE "Property"
SET "cashTermsVersion" = 1
WHERE "cashTermsAcceptedAt" IS NOT NULL;
