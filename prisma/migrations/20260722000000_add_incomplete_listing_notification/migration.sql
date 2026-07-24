-- Dédoublonnage des relances « annonce incomplète » (GROWTH_ROADMAP.md §G2) :
-- même patron que Notification_expiring_soon_unique — un index unique PARTIEL
-- garantit qu'un sondage concurrent ne doublonne jamais la relance.
CREATE UNIQUE INDEX "Notification_incomplete_listing_unique" ON "Notification"("userId", "href") WHERE "type" = 'ANNONCE_INCOMPLETE';
