/**
 * Tests — suspension progressive : état actif (temporaire expirée vs indéfinie)
 * et paliers de durée croissants.
 */
import { describe, expect, it } from "vitest";
import { isSuspended, nextSuspension, nextSuspensionDays } from "@/lib/suspension";

const DAY = 86_400_000;
const NOW = new Date("2026-06-01T00:00:00.000Z");

describe("isSuspended", () => {
  it("non suspendu → false", () => {
    expect(isSuspended({ suspended: false, suspendedUntil: null }, NOW)).toBe(false);
  });

  it("suspension temporaire en cours → true", () => {
    const until = new Date(NOW.getTime() + 2 * DAY);
    expect(isSuspended({ suspended: true, suspendedUntil: until }, NOW)).toBe(true);
  });

  it("suspension temporaire expirée → false (déblocage paresseux)", () => {
    const until = new Date(NOW.getTime() - 1 * DAY);
    expect(isSuspended({ suspended: true, suspendedUntil: until }, NOW)).toBe(false);
  });

  it("suspension indéfinie (until null) → true", () => {
    expect(isSuspended({ suspended: true, suspendedUntil: null }, NOW)).toBe(true);
  });
});

describe("nextSuspension", () => {
  it("1re suspension = 3 jours", () => {
    expect(nextSuspension(1, NOW).until?.getTime()).toBe(NOW.getTime() + 3 * DAY);
  });

  it("2e suspension = 14 jours", () => {
    expect(nextSuspension(2, NOW).until?.getTime()).toBe(NOW.getTime() + 14 * DAY);
  });

  it("au-delà des paliers → indéfinie (null)", () => {
    expect(nextSuspension(3, NOW).until).toBeNull();
    expect(nextSuspension(9, NOW).until).toBeNull();
  });
});

describe("nextSuspensionDays — durée de la PROCHAINE suspension", () => {
  it("jamais suspendu (0) → prochaine = 3 jours", () => {
    expect(nextSuspensionDays(0)).toBe(3);
  });
  it("déjà suspendu 1 fois → prochaine = 14 jours", () => {
    expect(nextSuspensionDays(1)).toBe(14);
  });
  it("déjà suspendu 2 fois ou plus → prochaine indéfinie (null)", () => {
    expect(nextSuspensionDays(2)).toBeNull();
    expect(nextSuspensionDays(5)).toBeNull();
  });
});
