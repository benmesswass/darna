-- Dédoublonnage des relances « réservation abandonnée » (LANCEMENT_ROADMAP.md
-- §L3.3 / GROWTH_ROADMAP.md §G6) : même patron que Notification_incomplete_listing_unique
-- — un index unique PARTIEL garantit qu'un tick concurrent ne doublonne jamais
-- la relance pour une même (userId, href).
CREATE UNIQUE INDEX "Notification_reservation_abandonnee_unique" ON "Notification"("userId", "href") WHERE "type" = 'RESERVATION_ABANDONNEE';
