-- Alertes de recherche sauvegardée (F7) : ville + fourchette de prix.
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "prixMin" INTEGER,
    "prixMax" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SavedSearch_city_idx" ON "SavedSearch"("city");

CREATE UNIQUE INDEX "SavedSearch_userId_city_prixMin_prixMax_key" ON "SavedSearch"("userId", "city", "prixMin", "prixMax");

ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
