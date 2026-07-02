-- Avis symétrique « hôte → voyageur » (F1) : note le comportement du voyageur,
-- distinct de Review (voyageur → annonce). Un seul avis hôte par réservation.
CREATE TABLE "GuestReview" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "GuestReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuestReview_bookingId_key" ON "GuestReview"("bookingId");

CREATE INDEX "GuestReview_targetId_idx" ON "GuestReview"("targetId");

ALTER TABLE "GuestReview" ADD CONSTRAINT "GuestReview_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GuestReview" ADD CONSTRAINT "GuestReview_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GuestReview" ADD CONSTRAINT "GuestReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
