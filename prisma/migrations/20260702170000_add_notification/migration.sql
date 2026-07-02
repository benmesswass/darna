-- Centre de notifications in-app (F9) : générique, au-delà de la messagerie.
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "propertyTitle" TEXT,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- Dédoublonnage des alertes « annonce bientôt expirée » : un index unique
-- PARTIEL (pas représentable dans le DSL Prisma, cf. commentaire sur le
-- modèle Notification) garantit qu'un INSERT concurrent (deux sondes
-- simultanées) échoue proprement (P2002) plutôt que de doublonner — les
-- autres types de notification ne sont pas contraints par cet index.
CREATE UNIQUE INDEX "Notification_expiring_soon_unique" ON "Notification"("userId", "href") WHERE "type" = 'ANNONCE_EXPIRE_BIENTOT';

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
