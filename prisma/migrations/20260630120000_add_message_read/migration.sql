-- Lu/non lu de la messagerie interne : `readAt` est posé quand le destinataire
-- (l'autre participant de la réservation) ouvre le fil. Null = non lu → alimente
-- la pastille « Messagerie », la notification in-app et l'e-mail de relance.
ALTER TABLE "Message" ADD COLUMN "readAt" TIMESTAMP(3);

CREATE INDEX "Message_senderId_readAt_idx" ON "Message"("senderId", "readAt");
