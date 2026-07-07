/**
 * AHC3 (ANNULATION_HOTE_CORRECTIFS_ROADMAP.md) — visibilité hôte du blocage.
 *
 * Prouve : à l'annulation hôte, l'HÔTE reçoit sa propre notification
 * (« annonce masquée ») pointant vers son dashboard d'annonces, en plus de la
 * notification voyageur existante ; et le libellé composé existe dans les
 * trois locales (fr/en/ar).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: vi.fn() },
    notification: { create: vi.fn() },
  },
}));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));
vi.mock("@/lib/notifications", () => ({
  sendHostInvoiceDueSoonEmail: vi.fn(),
  sendHostInvoiceOverdueEmail: vi.fn(),
}));

import { notifyBookingCancelledByHost } from "@/lib/notification-center";
import { notificationMessage } from "@/lib/notification-text";
import { prisma } from "@/lib/prisma";
import { fr } from "@/lib/i18n/fr";
import { en } from "@/lib/i18n/en";
import { ar } from "@/lib/i18n/ar";

const bookingFindUnique = prisma.booking.findUnique as unknown as Mock;
const notifCreate = prisma.notification.create as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  notifCreate.mockResolvedValue({});
});

describe("notifyBookingCancelledByHost — notifie AUSSI l'hôte (§AHC3)", () => {
  it("crée une notif voyageur (relogement) ET une notif hôte (annonce masquée)", async () => {
    bookingFindUnique.mockResolvedValue({
      guestId: "guest-1",
      property: { title: "Villa Hammamet", ownerId: "host-1" },
    });

    await notifyBookingCancelledByHost("bk_1");

    expect(notifCreate).toHaveBeenCalledTimes(2);
    const payloads = notifCreate.mock.calls.map((c) => c[0].data);

    const guestNotif = payloads.find((p) => p.userId === "guest-1");
    expect(guestNotif).toMatchObject({
      type: "RESERVATION_ANNULEE_PAR_HOTE",
      href: "/relogement/bk_1",
    });

    const hostNotif = payloads.find((p) => p.userId === "host-1");
    expect(hostNotif).toMatchObject({
      type: "ANNONCE_MASQUEE_ANNULATION",
      href: "/dashboard/annonces",
      propertyTitle: "Villa Hammamet",
    });
  });

  it("ne fait rien si la réservation est introuvable", async () => {
    bookingFindUnique.mockResolvedValue(null);
    await notifyBookingCancelledByHost("nope");
    expect(notifCreate).not.toHaveBeenCalled();
  });
});

describe("notificationMessage — libellé « annonce masquée » dans les 3 locales", () => {
  it.each([
    ["fr", fr],
    ["en", en],
    ["ar", ar],
  ])("%s : libellé non vide contenant le titre de l'annonce", (_locale, dict) => {
    const msg = notificationMessage(dict, {
      type: "ANNONCE_MASQUEE_ANNULATION",
      propertyTitle: "Villa Hammamet",
    });
    expect(msg).not.toBe("");
    expect(msg).toContain("Villa Hammamet");
  });
});
