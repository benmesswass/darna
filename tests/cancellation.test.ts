import { describe, expect, it } from "vitest";
import {
  computeRefund,
  computeBookingRefund,
  cancellationSchedule,
} from "@/lib/cancellation";

const DAY_MS = 86_400_000;
function daysFromNow(n: number) {
  return new Date(Date.now() + n * DAY_MS);
}
// Réservation créée il y a longtemps → hors période de grâce 24 h par défaut.
const OLD = new Date(Date.now() - 10 * DAY_MS);

describe("computeRefund — FLEXIBLE", () => {
  it("100 % si ≥ 1 jour avant check-in", () => {
    const r = computeRefund(300, daysFromNow(2), "FLEXIBLE", OLD);
    expect(r.refundRate).toBe(1);
    expect(r.refundAmount).toBe(300);
  });

  it("0 % si < 1 jour avant check-in", () => {
    const r = computeRefund(300, daysFromNow(0.5), "FLEXIBLE", OLD);
    expect(r.refundRate).toBe(0);
    expect(r.refundAmount).toBe(0);
  });
});

describe("computeRefund — MODEREE", () => {
  it("100 % si ≥ 5 jours avant check-in", () => {
    const r = computeRefund(200, daysFromNow(6), "MODEREE", OLD);
    expect(r.refundRate).toBe(1);
    expect(r.refundAmount).toBe(200);
  });

  it("0 % si < 5 jours avant check-in", () => {
    const r = computeRefund(200, daysFromNow(3), "MODEREE", OLD);
    expect(r.refundRate).toBe(0);
    expect(r.refundAmount).toBe(0);
  });
});

describe("computeRefund — FERME", () => {
  it("100 % si ≥ 30 jours avant check-in", () => {
    const r = computeRefund(500, daysFromNow(31), "FERME", OLD);
    expect(r.refundRate).toBe(1);
    expect(r.refundAmount).toBe(500);
  });

  it("50 % si entre 7 et 30 jours avant", () => {
    const r = computeRefund(500, daysFromNow(15), "FERME", OLD);
    expect(r.refundRate).toBe(0.5);
    expect(r.refundAmount).toBe(250);
  });

  it("0 % si < 7 jours avant", () => {
    const r = computeRefund(500, daysFromNow(3), "FERME", OLD);
    expect(r.refundRate).toBe(0);
    expect(r.refundAmount).toBe(0);
  });
});

describe("computeRefund — STRICTE", () => {
  it("50 % si ≥ 14 jours avant check-in", () => {
    const r = computeRefund(400, daysFromNow(20), "STRICTE", OLD);
    expect(r.refundRate).toBe(0.5);
    expect(r.refundAmount).toBe(200);
  });

  it("0 % si < 14 jours avant check-in", () => {
    const r = computeRefund(400, daysFromNow(7), "STRICTE", OLD);
    expect(r.refundRate).toBe(0);
    expect(r.refundAmount).toBe(0);
  });
});

describe("computeRefund — période de grâce 24 h", () => {
  it("100 % même en STRICTE si annulé < 24 h après résa et check-in ≥ 7 j", () => {
    const justBooked = new Date(Date.now() - 2 * 60 * 60 * 1000); // il y a 2 h
    const r = computeRefund(400, daysFromNow(10), "STRICTE", justBooked);
    expect(r.grace).toBe(true);
    expect(r.refundRate).toBe(1);
    expect(r.refundAmount).toBe(400);
  });

  it("PAS de grâce si check-in à moins de 7 jours (politique reprend la main)", () => {
    const justBooked = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const r = computeRefund(400, daysFromNow(3), "STRICTE", justBooked);
    expect(r.grace).toBe(false);
    expect(r.refundRate).toBe(0);
  });

  it("PAS de grâce si la résa date de plus de 24 h", () => {
    const r = computeRefund(400, daysFromNow(20), "STRICTE", OLD);
    expect(r.grace).toBe(false);
    expect(r.refundRate).toBe(0.5);
  });
});

describe("computeRefund — arrondi", () => {
  it("arrondit à l'entier le plus proche (50 % de 301 = 150.5 → 151)", () => {
    const r = computeRefund(301, daysFromNow(20), "STRICTE", OLD);
    expect(r.refundAmount).toBe(151);
  });
});

describe("computeBookingRefund — commission rendue seulement si gratuit", () => {
  const amountPaid = 1000;
  const serviceFee = 80;

  it("annulation gratuite (100 %) → remboursement INTÉGRAL, commission comprise", () => {
    const r = computeBookingRefund(amountPaid, serviceFee, daysFromNow(2), "FLEXIBLE", OLD);
    expect(r.refundRate).toBe(1);
    expect(r.refundAmount).toBe(1000);
  });

  it("grâce 24 h → remboursement intégral, commission comprise", () => {
    const justBooked = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const r = computeBookingRefund(amountPaid, serviceFee, daysFromNow(20), "STRICTE", justBooked);
    expect(r.grace).toBe(true);
    expect(r.refundAmount).toBe(1000);
  });

  it("annulation partielle (50 %) → commission acquise, 50 % du reste seulement", () => {
    // base = 1000 − 80 = 920 ; 50 % = 460. La commission n'est pas rendue.
    const r = computeBookingRefund(amountPaid, serviceFee, daysFromNow(20), "STRICTE", OLD);
    expect(r.refundRate).toBe(0.5);
    expect(r.refundAmount).toBe(460);
  });

  it("aucun remboursement (0 %) → rien, commission acquise", () => {
    const r = computeBookingRefund(amountPaid, serviceFee, daysFromNow(3), "STRICTE", OLD);
    expect(r.refundRate).toBe(0);
    expect(r.refundAmount).toBe(0);
  });

  it("acompte = commission, annulation gratuite → rembourse l'acompte entier", () => {
    const r = computeBookingRefund(80, 80, daysFromNow(2), "FLEXIBLE", OLD);
    expect(r.refundAmount).toBe(80);
  });
});

describe("cancellationSchedule — paliers datés", () => {
  const DAY = DAY_MS;
  const checkIn = new Date("2026-07-18T00:00:00.000Z");

  it("FERME : palier 100 % à J-30 puis 50 % à J-7", () => {
    const tiers = cancellationSchedule("FERME", checkIn);
    expect(tiers).toHaveLength(2);
    expect(tiers[0].rate).toBe(1);
    expect(tiers[0].until.getTime()).toBe(checkIn.getTime() - 30 * DAY);
    expect(tiers[1].rate).toBe(0.5);
    expect(tiers[1].until.getTime()).toBe(checkIn.getTime() - 7 * DAY);
  });

  it("STRICTE : un seul palier 50 % à J-14 (aucun palier gratuit)", () => {
    const tiers = cancellationSchedule("STRICTE", checkIn);
    expect(tiers).toHaveLength(1);
    expect(tiers[0].rate).toBe(0.5);
    expect(tiers[0].until.getTime()).toBe(checkIn.getTime() - 14 * DAY);
  });

  it("FLEXIBLE : gratuit jusqu'à J-1", () => {
    const tiers = cancellationSchedule("FLEXIBLE", checkIn);
    expect(tiers).toEqual([{ rate: 1, until: new Date(checkIn.getTime() - 1 * DAY) }]);
  });
});
