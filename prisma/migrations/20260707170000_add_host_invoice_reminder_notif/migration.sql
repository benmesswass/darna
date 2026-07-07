-- CreateIndex (dedup partiel, un par type — cf. commentaire schema.prisma sur Notification)
CREATE UNIQUE INDEX "Notification_facture_bientot_due_unique" ON "Notification"("userId", "href") WHERE "type" = 'FACTURE_BIENTOT_DUE';
CREATE UNIQUE INDEX "Notification_facture_en_retard_unique" ON "Notification"("userId", "href") WHERE "type" = 'FACTURE_EN_RETARD';
