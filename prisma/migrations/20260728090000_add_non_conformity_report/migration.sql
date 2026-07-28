-- LANCEMENT_ROADMAP.md §L5.3 : garantie non-conformité — dossier de
-- signalement voyageur (RECU/VALIDE/REJETE) rejoignant le circuit de
-- règlement existant (Booking.refundAmount/refundPaidAt, §L5.2) une fois
-- validé par un admin.
CREATE TABLE "NonConformityReport" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "NonConformityReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NonConformityReport_bookingId_key" ON "NonConformityReport"("bookingId");

-- CreateIndex
CREATE INDEX "NonConformityReport_status_idx" ON "NonConformityReport"("status");

-- AddForeignKey
ALTER TABLE "NonConformityReport" ADD CONSTRAINT "NonConformityReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformityReport" ADD CONSTRAINT "NonConformityReport_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
