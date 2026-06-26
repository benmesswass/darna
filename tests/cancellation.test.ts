import { describe, expect, it } from "vitest";
import { computeRefund } from "@/lib/cancellation";

const DAY_MS = 86_400_000;
function daysFromNow(n: number) {
  return new Date(Date.now() + n * DAY_MS);
}

describe("computeRefund — FLEXIBLE", () => {
  it("100 % si ≥ 1 jour avant check-in", () => {
    const r = computeRefund(300, daysFromNow(2), "FLEXIBLE");
    expect(r.refundRate).toBe(1);
    expect(r.refundAmount).toBe(300);
  });

  it("0 % si < 1 jour avant check-in", () => {
    const r = computeRefund(300, daysFromNow(0.5), "FLEXIBLE");
    expect(r.refundRate).toBe(0);
    expect(r.refundAmount).toBe(0);
  });
});

describe("computeRefund — MODEREE", () => {
  it("100 % si ≥ 7 jours avant check-in", () => {
    const r = computeRefund(200, daysFromNow(10), "MODEREE");
    expect(r.refundRate).toBe(1);
    expect(r.refundAmount).toBe(200);
  });

  it("0 % si < 7 jours avant check-in", () => {
    const r = computeRefund(200, daysFromNow(3), "MODEREE");
    expect(r.refundRate).toBe(0);
    expect(r.refundAmount).toBe(0);
  });

  it("0 % si déjà passé", () => {
    const r = computeRefund(200, daysFromNow(-1), "MODEREE");
    expect(r.refundAmount).toBe(0);
  });
});

describe("computeRefund — STRICTE", () => {
  it("50 % si ≥ 14 jours avant check-in", () => {
    const r = computeRefund(400, daysFromNow(20), "STRICTE");
    expect(r.refundRate).toBe(0.5);
    expect(r.refundAmount).toBe(200);
  });

  it("0 % si < 14 jours avant check-in", () => {
    const r = computeRefund(400, daysFromNow(7), "STRICTE");
    expect(r.refundRate).toBe(0);
    expect(r.refundAmount).toBe(0);
  });
});

describe("computeRefund — arrondi", () => {
  it("arrondit à l'entier le plus proche (50 % de 301 = 150.5 → 151)", () => {
    const r = computeRefund(301, daysFromNow(20), "STRICTE");
    expect(r.refundAmount).toBe(151);
  });
});
