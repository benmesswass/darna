-- Gating du contact derrière un acompte (anti-bypass Darna).
-- depositAmount : acompte minimum dû en ligne (= max(10% du total, commission Darna), ≤ total).
-- amountPaid    : montant réellement choisi puis encaissé (entre depositAmount et totalPrice).
ALTER TABLE "Booking" ADD COLUMN "depositAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "amountPaid" INTEGER NOT NULL DEFAULT 0;
