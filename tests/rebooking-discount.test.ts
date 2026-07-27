/**
 * AH7 (ANNULATION_HOTE_ROADMAP.md / QA_ROADMAP.md §3, D12) — durcissement
 * sécurité de la réduction ponctuelle (§AH4) : le token signé (HMAC) ne doit
 * être valide que pour LE bon voyageur, une seule fois, et dans sa fenêtre de
 * validité — jamais rejouable, jamais transférable à un autre compte.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { booking: { findUnique: vi.fn() } },
}));

import {
  claimRebookingDiscount,
  computeRebookingDiscount,
  isRebookingDiscountValid,
  signRebookingDiscount,
} from "@/lib/rebooking-discount";
import { prisma } from "@/lib/prisma";

const bookingFindUnique = prisma.booking.findUnique as unknown as Mock;

const CANCELLED_BOOKING_ID = "clbooking0000000000000001";
const GUEST_ID = "guest-1";
const ATTACKER_ID = "guest-attacker";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("computeRebookingDiscount — taux et plafonds (§L5.1 : jamais au-delà des frais)", () => {
  it("10 % sous le plafond (1000 TND → 100 TND), quand les frais le permettent", () => {
    expect(computeRebookingDiscount(1000, 200)).toBe(100);
  });

  it("plafonné à 150 TND au-delà (2000 TND → 150 TND, pas 200), quand les frais le permettent", () => {
    expect(computeRebookingDiscount(2000, 300)).toBe(150);
  });

  it("arrondit au TND le plus proche", () => {
    expect(computeRebookingDiscount(333, 100)).toBe(33); // 33.3 → 33
  });

  it("ne dépasse JAMAIS les frais Darna de la nouvelle réservation, même sous les autres plafonds", () => {
    // 10 % de 2000 = 200, plafond TND = 150 — mais les frais de la nouvelle
    // résa ne sont que 15 : Darna ne peut offrir plus qu'elle n'encaisse.
    expect(computeRebookingDiscount(2000, 15)).toBe(15);
  });
});

describe("isRebookingDiscountValid — lecture (D12)", () => {
  it("valide pour le bon voyageur, réservation non consommée", async () => {
    const token = signRebookingDiscount(CANCELLED_BOOKING_ID, GUEST_ID);
    bookingFindUnique.mockResolvedValue({ guestId: GUEST_ID, rebookingDiscountUsedFor: null });

    await expect(isRebookingDiscountValid(token, GUEST_ID)).resolves.toBe(true);
  });

  it("refuse un autre voyageur que celui pour qui le token a été signé", async () => {
    const token = signRebookingDiscount(CANCELLED_BOOKING_ID, GUEST_ID);

    await expect(isRebookingDiscountValid(token, ATTACKER_ID)).resolves.toBe(false);
    expect(bookingFindUnique).not.toHaveBeenCalled(); // rejeté dès la signature, sans requête DB
  });

  it("refuse un token altéré (signature invalide)", async () => {
    const token = signRebookingDiscount(CANCELLED_BOOKING_ID, GUEST_ID);
    const [payload] = token.split(".");
    const tampered = `${payload}.signature-invalide-falsifiee-xx`;

    await expect(isRebookingDiscountValid(tampered, GUEST_ID)).resolves.toBe(false);
  });

  it("refuse un token déjà consommé (rebookingDiscountUsedFor déjà posé)", async () => {
    const token = signRebookingDiscount(CANCELLED_BOOKING_ID, GUEST_ID);
    bookingFindUnique.mockResolvedValue({
      guestId: GUEST_ID,
      rebookingDiscountUsedFor: "clbooking0000000000000099",
    });

    await expect(isRebookingDiscountValid(token, GUEST_ID)).resolves.toBe(false);
  });

  it("refuse un token expiré (au-delà de REBOOKING_DISCOUNT_VALIDITY_DAYS)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = signRebookingDiscount(CANCELLED_BOOKING_ID, GUEST_ID);

    vi.setSystemTime(new Date("2026-02-15T00:00:00Z")); // + 45 jours > 30 jours de validité
    bookingFindUnique.mockResolvedValue({ guestId: GUEST_ID, rebookingDiscountUsedFor: null });

    await expect(isRebookingDiscountValid(token, GUEST_ID)).resolves.toBe(false);
  });
});

describe("claimRebookingDiscount — consommation atomique, usage unique (D12)", () => {
  function fakeTx(updateManyResult: { count: number }) {
    return { booking: { updateMany: vi.fn().mockResolvedValue(updateManyResult) } };
  }

  it("réclame avec succès un token valide, pas encore consommé", async () => {
    const token = signRebookingDiscount(CANCELLED_BOOKING_ID, GUEST_ID);
    const tx = fakeTx({ count: 1 });

    const result = await claimRebookingDiscount(tx as never, token, GUEST_ID);

    expect(result).toBe(CANCELLED_BOOKING_ID);
    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: { id: CANCELLED_BOOKING_ID, guestId: GUEST_ID, rebookingDiscountUsedFor: null },
      data: { rebookingDiscountUsedFor: "PENDING" },
    });
  });

  it("rejeu (2e réclamation) : le updateMany ne trouve plus la ligne dans l'état attendu → null", async () => {
    const token = signRebookingDiscount(CANCELLED_BOOKING_ID, GUEST_ID);
    // La 1re réclamation a déjà posé rebookingDiscountUsedFor : la 2e requête
    // WHERE ... rebookingDiscountUsedFor: null ne matche plus rien.
    const tx = fakeTx({ count: 0 });

    const result = await claimRebookingDiscount(tx as never, token, GUEST_ID);

    expect(result).toBeNull();
  });

  it("refuse qu'un autre voyageur réclame le token de quelqu'un d'autre", async () => {
    const token = signRebookingDiscount(CANCELLED_BOOKING_ID, GUEST_ID);
    const tx = fakeTx({ count: 1 });

    const result = await claimRebookingDiscount(tx as never, token, ATTACKER_ID);

    expect(result).toBeNull();
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
  });

  it("refuse un token dont la signature a été falsifiée", async () => {
    const token = signRebookingDiscount(CANCELLED_BOOKING_ID, GUEST_ID);
    const [payload] = token.split(".");
    const tampered = `${payload}.signature-invalide-falsifiee-xx`;
    const tx = fakeTx({ count: 1 });

    const result = await claimRebookingDiscount(tx as never, tampered, GUEST_ID);

    expect(result).toBeNull();
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
  });
});
