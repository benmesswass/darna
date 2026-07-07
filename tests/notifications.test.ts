import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// On isole la notification de la DB et du provider e-mail : seule compte sa
// logique (récupération résa, contenu envoyé, robustesse non bloquante).
vi.mock("@/lib/prisma", () => ({
  prisma: { booking: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/mailer", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));

import {
  sendBookingConfirmationEmail,
  sendBookingCancelledByHostEmail,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { logStructured } from "@/lib/audit";

const findUnique = prisma.booking.findUnique as unknown as Mock;
const send = sendEmail as unknown as Mock;
const logged = logStructured as unknown as Mock;

function bookingRow() {
  return {
    id: "bk_1",
    checkIn: new Date("2026-07-10T00:00:00.000Z"),
    checkOut: new Date("2026-07-13T00:00:00.000Z"), // 3 nuits
    guests: 2,
    totalPrice: 360,
    demo: false,
    guest: { email: "voyageur@example.com", name: "Wassim" },
    property: { title: "Villa Hammamet" },
  };
}

describe("sendBookingConfirmationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    send.mockResolvedValue(true);
  });

  it("envoie l'e-mail au voyageur avec le bon sujet et le titre de l'annonce", async () => {
    findUnique.mockResolvedValue(bookingRow());

    await sendBookingConfirmationEmail("bk_1");

    expect(send).toHaveBeenCalledTimes(1);
    const arg = send.mock.calls[0][0];
    expect(arg.to).toBe("voyageur@example.com");
    expect(arg.subject).toContain("Villa Hammamet");
    // Le corps reprend les infos clés de la réservation.
    expect(arg.html).toContain("Villa Hammamet");
    expect(arg.html).toContain("Wassim");
    expect(arg.html).toContain("360 TND");
    expect(arg.html).toContain(">3<"); // 3 nuits
  });

  it("affiche la mention démo quand la réservation est de démonstration", async () => {
    findUnique.mockResolvedValue({ ...bookingRow(), demo: true });
    await sendBookingConfirmationEmail("bk_1");
    expect(send.mock.calls[0][0].html).toContain("démonstration");
  });

  it("n'affiche pas la mention démo pour une vraie réservation", async () => {
    findUnique.mockResolvedValue(bookingRow());
    await sendBookingConfirmationEmail("bk_1");
    expect(send.mock.calls[0][0].html).not.toContain("démonstration");
  });

  it("ne tente rien et journalise si la réservation est introuvable", async () => {
    findUnique.mockResolvedValue(null);
    await sendBookingConfirmationEmail("nope");
    expect(send).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith(
      "warn",
      "notif.booking_confirm_not_found",
      expect.objectContaining({ bookingId: "nope" })
    );
  });

  it("est NON BLOQUANT : un échec d'envoi est avalé (jamais d'exception)", async () => {
    findUnique.mockResolvedValue(bookingRow());
    send.mockRejectedValue(new Error("Resend 500"));

    await expect(sendBookingConfirmationEmail("bk_1")).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalledWith(
      "error",
      "notif.booking_confirm_failed",
      expect.objectContaining({ bookingId: "bk_1" })
    );
  });
});

describe("sendBookingCancelledByHostEmail (§AHC4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    send.mockResolvedValue(true);
  });

  it("envoie au voyageur l'annulation avec le montant remboursé et le lien de relogement", async () => {
    findUnique.mockResolvedValue({
      refundAmount: 206,
      guest: { email: "voyageur@example.com", name: "Wassim" },
      property: { title: "Villa Hammamet" },
    });

    await sendBookingCancelledByHostEmail("bk_1");

    expect(send).toHaveBeenCalledTimes(1);
    const arg = send.mock.calls[0][0];
    expect(arg.to).toBe("voyageur@example.com");
    expect(arg.subject).toContain("Villa Hammamet");
    expect(arg.html).toContain("Wassim");
    expect(arg.html).toContain("206 TND");
    expect(arg.html).toContain("/relogement/bk_1");
  });

  it("cas SUR_PLACE (refundAmount 0) : pas de montant, mention « rien à récupérer »", async () => {
    findUnique.mockResolvedValue({
      refundAmount: 0,
      guest: { email: "voyageur@example.com", name: "Wassim" },
      property: { title: "Villa Hammamet" },
    });

    await sendBookingCancelledByHostEmail("bk_1");

    const arg = send.mock.calls[0][0];
    expect(arg.html).not.toContain("TND");
    expect(arg.html).toContain("récupérer");
  });

  it("ne tente rien et journalise si la réservation est introuvable", async () => {
    findUnique.mockResolvedValue(null);
    await sendBookingCancelledByHostEmail("nope");
    expect(send).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith(
      "warn",
      "notif.host_cancel_not_found",
      expect.objectContaining({ bookingId: "nope" })
    );
  });

  it("est NON BLOQUANT : un échec d'envoi est avalé", async () => {
    findUnique.mockResolvedValue({
      refundAmount: 206,
      guest: { email: "voyageur@example.com", name: "Wassim" },
      property: { title: "Villa Hammamet" },
    });
    send.mockRejectedValue(new Error("Resend 500"));

    await expect(sendBookingCancelledByHostEmail("bk_1")).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalledWith(
      "error",
      "notif.host_cancel_failed",
      expect.objectContaining({ bookingId: "bk_1" })
    );
  });
});
