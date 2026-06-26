import { describe, expect, it } from "vitest";
import { computeRefund } from "@/lib/cancellation";

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
