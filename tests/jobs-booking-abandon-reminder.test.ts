/**
 * LANCEMENT_ROADMAP.md §L3.3 / GROWTH_ROADMAP.md §G6 — relance de réservation
 * abandonnée : anti-double-envoi via l'index unique partiel (P2002
 * silencieux), e-mail + ProductEvent envoyés SEULEMENT après une notification
 * créée avec succès (jamais en double si le job est rejoué).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findMany: vi.fn() },
    notification: { create: vi.fn() },
  },
}));
vi.mock("@/lib/observability", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ sendBookingAbandonReminderEmail: vi.fn() }));
vi.mock("@/lib/product-events", () => ({ logProductEvent: vi.fn() }));

import { remindAbandonedBookings } from "@/lib/jobs/booking-abandon-reminder";
import { prisma } from "@/lib/prisma";
import { captureError } from "@/lib/observability";
import { sendBookingAbandonReminderEmail } from "@/lib/notifications";
import { logProductEvent } from "@/lib/product-events";

const findMany = prisma.booking.findMany as unknown as Mock;
const notifCreate = prisma.notification.create as unknown as Mock;
const captureErrorMock = captureError as unknown as Mock;
const emailMock = sendBookingAbandonReminderEmail as unknown as Mock;
const productEventMock = logProductEvent as unknown as Mock;

function row(id: string) {
  return { id, guestId: `guest-${id}`, property: { slug: `villa-${id}`, title: `Villa ${id}` } };
}

beforeEach(() => {
  vi.clearAllMocks();
  notifCreate.mockResolvedValue({});
});

describe("remindAbandonedBookings", () => {
  it("relance une réservation abandonnée : notification + e-mail + ProductEvent", async () => {
    findMany.mockResolvedValue([row("b1")]);

    const summary = await remindAbandonedBookings();

    expect(notifCreate).toHaveBeenCalledWith({
      data: {
        userId: "guest-b1",
        type: "RESERVATION_ABANDONNEE",
        propertyTitle: "Villa b1",
        href: "/annonce/villa-b1?resa=b1",
      },
    });
    expect(emailMock).toHaveBeenCalledWith("b1", expect.stringContaining("/annonce/villa-b1?resa=b1"));
    expect(productEventMock).toHaveBeenCalledWith({
      event: "BOOKING_ABANDON_REMINDED",
      userId: "guest-b1",
      metadata: { bookingId: "b1" },
    });
    expect(summary).toEqual({ checked: 1, reminded: 1 });
  });

  it("ne relance pas deux fois (P2002 = déjà notifié) — pas d'e-mail ni de ProductEvent", async () => {
    findMany.mockResolvedValue([row("b1")]);
    notifCreate.mockRejectedValue(Object.assign(new Error("unique constraint"), { code: "P2002" }));

    const summary = await remindAbandonedBookings();

    expect(emailMock).not.toHaveBeenCalled();
    expect(productEventMock).not.toHaveBeenCalled();
    expect(captureErrorMock).not.toHaveBeenCalled();
    expect(summary).toEqual({ checked: 1, reminded: 0 });
  });

  it("alerte l'observabilité sur une erreur inattendue (pas P2002), sans planter le job", async () => {
    findMany.mockResolvedValue([row("b1"), row("b2")]);
    notifCreate.mockRejectedValueOnce(new Error("db timeout")).mockResolvedValueOnce({});

    const summary = await remindAbandonedBookings();

    expect(captureErrorMock).toHaveBeenCalledTimes(1);
    expect(emailMock).toHaveBeenCalledTimes(1);
    expect(emailMock).toHaveBeenCalledWith("b2", expect.any(String));
    expect(summary).toEqual({ checked: 2, reminded: 1 });
  });

  it("filtre par status EN_ATTENTE et une fenêtre expiresAt (< maintenant, > il y a 24h)", async () => {
    findMany.mockResolvedValue([]);

    await remindAbandonedBookings();

    const call = findMany.mock.calls[0][0];
    expect(call.where.status).toBe("EN_ATTENTE");
    expect(call.where.expiresAt.lt).toBeInstanceOf(Date);
    expect(call.where.expiresAt.gt).toBeInstanceOf(Date);
    expect(call.where.expiresAt.lt.getTime()).toBeGreaterThan(call.where.expiresAt.gt.getTime());
  });

  it("est rejouable : un 2e appel sur une réservation déjà relancée ne renvoie ni e-mail ni ProductEvent", async () => {
    findMany.mockResolvedValue([row("b1")]);
    notifCreate.mockResolvedValueOnce({});
    const first = await remindAbandonedBookings();

    notifCreate.mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "P2002" }));
    const second = await remindAbandonedBookings();

    expect(first.reminded).toBe(1);
    expect(second.reminded).toBe(0);
    expect(emailMock).toHaveBeenCalledTimes(1);
  });
});
