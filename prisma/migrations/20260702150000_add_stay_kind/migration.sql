-- Type de bien séjour (F5) : requis dès la création, comme ImmoDetails.kind.
-- Pas de backfill nécessaire (StayDetails est alimentée par l'app, jamais par
-- une donnée historique brute — cf. la même absence de backfill pour
-- ImmoDetails.kind ajouté sans défaut dans vertical_and_satellites).
ALTER TABLE "StayDetails" ADD COLUMN "kind" TEXT NOT NULL;
