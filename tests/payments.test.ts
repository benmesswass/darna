import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// On isole settleKonnectBooking de la DB et du réseau Konnect : seul compte sa
// logique de décision (idempotence, contrôle du montant, course webhook/retour).
vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/konnect", () => ({
  getKonnectPayment: vi.fn(),
  tndToMillimes: (tnd: number) => Math.round(tnd * 1000),
}));
vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
  logStructured: vi.fn(),
}));
// Notification isolée : on vérifie seulement qu'elle est déclenchée au bon
// moment (transition réelle vers CONFIRMEE), pas son rendu d'e-mail.
vi.mock("@/lib/notifications", () => ({
  sendBookingConfirmationEmail: vi.fn(),
}));
vi.mock("@/lib/notification-center", () => ({
  notifyBookingConfirmed: vi.fn(),
}));

import { settleKonnectBooking } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { getKonnectPayment, type KonnectPayment } from "@/lib/konnect";
import { logAudit } from "@/lib/audit";
import { sendBookingConfirmationEmail } from "@/lib/notifications";

const findFirst = prisma.booking.findFirst as unknown as Mock;
const updateMany = prisma.booking.updateMany as unknown as Mock;
const getPayment = getKonnectPayment as unknown as Mock;
const audit = logAudit as unknown as Mock;
const notify = sendBookingConfirmationEmail as unknown as Mock;

type BookingRow = {
  id: string;
  guestId: string;
  status: string;
  expiresAt: Date | null;
  totalPrice: number;
  paymentRef: string | null;
};

function row(over: Partial<BookingRow> = {}): BookingRow {
  return {
    id: "bk_1",
    guestId: "u_1",
    status: "EN_ATTENTE",
    expiresAt: new Date(Date.now() + 3_600_000), // +1 h : non expirée
    totalPrice: 120,
    paymentRef: "pay_1",
    ...over,
  };
}

function payment(over: Partial<KonnectPayment> = {}): KonnectPayment {
  return {
    id: "pay_1",
    status: "completed",
    amount: 120_000,
    reachedAmount: 120_000, // = 120 TND attendus
    token: "TND",
    ...over,
  };
}

describe("settleKonnectBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("retourne INTROUVABLE pour une référence inconnue (inoffensif)", async () => {
    findFirst.mockResolvedValue(null);
    expect(await settleKonnectBooking({ paymentRef: "nope" })).toBe("INTROUVABLE");
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("est idempotent : une réservation déjà CONFIRMEE ne re-vérifie rien", async () => {
    findFirst.mockResolvedValue(row({ status: "CONFIRMEE" }));
    expect(await settleKonnectBooking({ bookingId: "bk_1" })).toBe("CONFIRMEE");
    expect(getPayment).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("traite TERMINEE comme déjà réglée", async () => {
    findFirst.mockResolvedValue(row({ status: "TERMINEE" }));
    expect(await settleKonnectBooking({ bookingId: "bk_1" })).toBe("CONFIRMEE");
  });

  it("retourne ANNULEE pour une réservation déjà annulée", async () => {
    findFirst.mockResolvedValue(row({ status: "ANNULEE" }));
    expect(await settleKonnectBooking({ bookingId: "bk_1" })).toBe("ANNULEE");
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("retourne EN_ATTENTE si le paiement n'a jamais été initié (paymentRef null)", async () => {
    findFirst.mockResolvedValue(row({ paymentRef: null }));
    expect(await settleKonnectBooking({ bookingId: "bk_1" })).toBe("EN_ATTENTE");
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("ne confirme pas tant que Konnect n'a pas abouti (pending)", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment({ status: "pending" }));
    expect(await settleKonnectBooking({ paymentRef: "pay_1" })).toBe("EN_ATTENTE");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("REFUSE de confirmer si le montant reçu est inférieur au dû", async () => {
    findFirst.mockResolvedValue(row({ totalPrice: 120 }));
    getPayment.mockResolvedValue(payment({ reachedAmount: 100_000 })); // < 120 000
    expect(await settleKonnectBooking({ paymentRef: "pay_1" })).toBe("ERREUR");
    expect(updateMany).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("confirme et met sous séquestre un paiement abouti et complet", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment());
    updateMany.mockResolvedValue({ count: 1 });

    expect(await settleKonnectBooking({ paymentRef: "pay_1" })).toBe("CONFIRMEE");
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "bk_1", status: "EN_ATTENTE" },
        data: expect.objectContaining({ status: "CONFIRMEE", escrow: "EN_SEQUESTRE" }),
      })
    );
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PAYMENT_CONFIRMED", userId: "u_1", success: true })
    );
    // L'e-mail de confirmation est envoyé exactement une fois, pour cette résa.
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith("bk_1");
  });

  it("gère la course webhook/retour : si une autre requête a déjà confirmé, pas de double effet", async () => {
    findFirst.mockResolvedValue(row());
    getPayment.mockResolvedValue(payment());
    updateMany.mockResolvedValue({ count: 0 }); // déjà confirmée par la requête concurrente

    expect(await settleKonnectBooking({ paymentRef: "pay_1" })).toBe("CONFIRMEE");
    expect(audit).not.toHaveBeenCalled(); // pas de re-log ni d'effet de bord
    expect(notify).not.toHaveBeenCalled(); // pas de double e-mail
  });

  it("annule (et ne confirme jamais) un paiement abouti après expiration du créneau", async () => {
    findFirst.mockResolvedValue(row({ expiresAt: new Date(Date.now() - 3_600_000) })); // -1 h
    getPayment.mockResolvedValue(payment());

    expect(await settleKonnectBooking({ paymentRef: "pay_1" })).toBe("ANNULEE");
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "bk_1", status: "EN_ATTENTE" },
        data: { status: "ANNULEE" },
      })
    );
    expect(audit).not.toHaveBeenCalled();
  });
});
