-- LANCEMENT_ROADMAP.md §L5.2 : date de règlement RÉEL du remboursement des
-- frais (virement manuel ou crédit Darna) — null tant qu'un refundAmount est
-- dû mais non encore réglé. Posée par /dashboard/admin/remboursements.
ALTER TABLE "Booking" ADD COLUMN     "refundPaidAt" TIMESTAMP(3);
