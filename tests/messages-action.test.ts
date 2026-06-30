/**
 * Tests — sendMessageAction : autorisation serveur (participant + réservation
 * ferme), masquage CONTEXTUEL (uniquement tant que le contact est verrouillé)
 * et signalement (warned / audit) des tentatives de partage de coordonnées.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: vi.fn() },
    message: { create: vi.fn(), count: vi.fn().mockResolvedValue(1) },
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn().mockResolvedValue(true) }));
// L'e-mail au destinataire est testé ailleurs : ici on neutralise l'envoi pour
// isoler l'autorisation et le masquage.
vi.mock("@/lib/notifications", () => ({ sendNewMessageEmail: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn(), logAudit: vi.fn() }));
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
const DAY = 86_400_000;
// Arrivée lointaine → MODÉRÉE = fenêtre gratuite ouverte → contact VERROUILLÉ
// → masquage actif.
const FAR_CHECKIN = new Date(Date.now() + 30 * DAY);

function fd(body: string, bookingId = CUID): FormData {
  const f = new FormData();
  f.set("bookingId", bookingId);
  f.set("body", body);
  return f;
}

function mockBooking(
  over: Partial<{ status: string; guestId: string; ownerId: string; checkIn: Date; cancelPolicy: string }> = {}
) {
  (prisma.booking.findUnique as unknown as Mock).mockResolvedValue({
    id: CUID,
    status: over.status ?? "CONFIRMEE",
    checkIn: over.checkIn ?? FAR_CHECKIN,
    guestId: over.guestId ?? "guest1",
    property: { ownerId: over.ownerId ?? "host1", cancelPolicy: over.cancelPolicy ?? "MODEREE" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.message.count as unknown as Mock).mockResolvedValue(1);
  (prisma.message.create as unknown as Mock).mockResolvedValue({ id: "msg1" });
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

  it("refuse tant que la réservation n'est pas ferme au sens statut (EN_ATTENTE)", async () => {
    mockBooking({ status: "EN_ATTENTE" });
    const res = await sendMessageAction(undefined, fd("coucou"));
    expect(res).toEqual({ error: "indispo" });
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it("enregistre le message d'un participant (fenêtre gratuite → pas de coordonnée)", async () => {
    mockBooking();
    const res = await sendMessageAction(undefined, fd("Bonjour, à quelle heure l'arrivée ?"));
    expect(res).toEqual({ sent: true, warned: false });
    const data = (prisma.message.create as unknown as Mock).mock.calls[0][0].data;
    expect(data.flagged).toBe(false);
    expect(data.senderId).toBe("guest1");
  });

  it("masque un numéro + signale (warned) quand le contact est verrouillé", async () => {
    mockBooking();
    const res = await sendMessageAction(undefined, fd("appelle 20123456"));
    expect(res).toEqual({ sent: true, warned: true });
    const data = (prisma.message.create as unknown as Mock).mock.calls[0][0].data;
    expect(data.flagged).toBe(true);
    expect(data.body).not.toContain("20123456");
  });

  it("NE masque PAS une fois la réservation ferme (politique STRICTE = contact débloqué)", async () => {
    mockBooking({ cancelPolicy: "STRICTE" });
    const res = await sendMessageAction(undefined, fd("mon num 20123456"));
    expect(res).toEqual({ sent: true, warned: false });
    const data = (prisma.message.create as unknown as Mock).mock.calls[0][0].data;
    expect(data.flagged).toBe(false);
    expect(data.body).toContain("20123456");
  });

  it("autorise aussi l'hôte de la réservation", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ id: "host1" });
    mockBooking();
    const res = await sendMessageAction(undefined, fd("Bienvenue !"));
    expect(res).toEqual({ sent: true, warned: false });
  });
});
