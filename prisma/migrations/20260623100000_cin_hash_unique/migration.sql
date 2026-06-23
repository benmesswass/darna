-- Empreinte déterministe de la CIN : unicité inter-comptes (un même numéro de
-- CIN ne peut pas servir à deux comptes), sans stocker le numéro en clair.
ALTER TABLE "User" ADD COLUMN "cinHash" TEXT;
CREATE UNIQUE INDEX "User_cinHash_key" ON "User"("cinHash");
