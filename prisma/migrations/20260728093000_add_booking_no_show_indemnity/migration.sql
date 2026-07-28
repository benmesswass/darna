-- LANCEMENT_ROADMAP.md §L5.4 : date de réclamation de l'indemnité no-show
-- hôte (rail ESCROW) — source de vérité de l'idempotence, distincte du
-- passage à status="TERMINEE" (qui peut aussi survenir via la complétion
-- paresseuse normale, sans rapport avec un no-show).
ALTER TABLE "Booking" ADD COLUMN     "noShowIndemnityClaimedAt" TIMESTAMP(3);
