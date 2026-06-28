/**
 * Tests — sendMessageAction : autorisation serveur (participant + réservation
 * ferme) et masquage des coordonnées avant stockage.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { booking: { findUnique: vi.fn() }, message: { create: vi.fn() } },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: {
      tropDeTentatives: "trop",
      champsRequis: "champs",
      erreurInconnue: "inconnue",
    },
    messages: { indisponible: "indispo" },
  }),
}));

import { sendMessageAction } from "@/actions/messages";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const CUID = "ckv1bookingcuid000000000";

function fd(body: string, bookingId = CUID): FormData {
  const f = new FormData();
  f.set("bookingId", bookingId);
  f.set("body", body);
  return f;
}

function mockBooking(over: Partial<{ status: string; guestId: string; ownerId: string }> = {}) {
  (prisma.booking.findUnique as unknown as Mock).mockResolvedValue({
    id: CUID,
    status: over.status ?? "CONFIRMEE",
    guestId: over.guestId ?? "guest1",
    property: { ownerId: over.ownerId ?? "host1" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  (requireUser as unknown as Mock).mockResolvedValue({ id: "guest1" });
});

describe("sendMessageAction", () => {
  it("refuse un tiers étranger à la réservation (aucune écriture)", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ id: "intrus" });
    mockBooking();
    const res = await sendMessageAction(undefined, fd("coucou"));
    expect(res).toEqual({ error: "inconnue" });
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it("refuse tant que la réservation n'est pas ferme (EN_ATTENTE)", async () => {
    mockBooking({ status: "EN_ATTENTE" });
    const res = await sendMessageAction(undefined, fd("coucou"));
    expect(res).toEqual({ error: "indispo" });
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it("enregistre le message d'un participant sur une réservation confirmée", async () => {
    mockBooking();
    const res = await sendMessageAction(undefined, fd("Bonjour, à quelle heure l'arrivée ?"));
    expect(res).toEqual({ sent: true });
    expect(prisma.message.create).toHaveBeenCalledTimes(1);
    const data = (prisma.message.create as unknown as Mock).mock.calls[0][0].data;
    expect(data.flagged).toBe(false);
    expect(data.senderId).toBe("guest1");
  });

  it("masque un numéro de téléphone avant stockage et flague", async () => {
    mockBooking();
    await sendMessageAction(undefined, fd("appelle 20123456"));
    const data = (prisma.message.create as unknown as Mock).mock.calls[0][0].data;
    expect(data.flagged).toBe(true);
    expect(data.body).not.toContain("20123456");
  });

  it("autorise aussi l'hôte de la réservation", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ id: "host1" });
    mockBooking();
    const res = await sendMessageAction(undefined, fd("Bienvenue !"));
    expect(res).toEqual({ sent: true });
  });
});
