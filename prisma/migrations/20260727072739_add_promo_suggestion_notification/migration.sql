-- Dédoublonnage du nudge promo « nuits vides » (CROISSANCE_ROADMAP.md §PM2) :
-- même patron que Notification_expiring_soon_unique / Notification_incomplete_
-- listing_unique — un index unique PARTIEL garantit qu'un sondage concurrent
-- ne doublonne jamais la relance. Le href est bucketé par mois côté
-- application (?promo=AAAA-MM) : cet index dédup donc par annonce ET par mois.
CREATE UNIQUE INDEX "Notification_promo_suggestion_unique" ON "Notification"("userId", "href") WHERE "type" = 'ANNONCE_PROMO_SUGGEREE';
