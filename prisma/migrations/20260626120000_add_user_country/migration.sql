-- Pays de résidence déclaré à l'inscription (libellé FR, cf. PHONE_COUNTRIES).
-- Clé du pilotage diaspora dans le tableau de bord founder (cible France).
ALTER TABLE "User" ADD COLUMN "country" TEXT;
