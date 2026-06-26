-- Compteur de version de session : incrémenté à chaque changement de mot de passe
-- (reset ou changement depuis le profil). Les JWT émis avec une version inférieure
-- sont rejetés par getSessionUser → sessions actives invalidées immédiatement.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
