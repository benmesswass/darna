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
    user: {
      update: vi.fn(),
      findUnique: vi.fn().mockResolvedValue({ suspensionCount: 0 }),
    },
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn(), logAudit: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: {
      tropDeTentatives: "trop",
      champsRequis: "champs",
      erreurInconnue: "inconnue",
    },
    messages: { indisponible: "indispo", compteSuspendu: "suspendu" },
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
    expect(res).toEqual({ sent: true, warned: false, escalated: false, suspended: false });
    const data = (prisma.message.create as unknown as Mock).mock.calls[0][0].data;
    expect(data.flagged).toBe(false);
    expect(data.senderId).toBe("guest1");
  });

  it("masque un numéro + signale (warned) quand le contact est verrouillé", async () => {
    mockBooking();
    const res = await sendMessageAction(undefined, fd("appelle 20123456"));
    expect(res).toEqual({ sent: true, warned: true, escalated: false, suspended: false });
    const data = (prisma.message.create as unknown as Mock).mock.calls[0][0].data;
    expect(data.flagged).toBe(true);
    expect(data.body).not.toContain("20123456");
  });

  it("escalade (avertissement suspension) au-delà du seuil de tentatives", async () => {
    mockBooking();
    (prisma.message.count as unknown as Mock).mockResolvedValue(3);
    const res = await sendMessageAction(undefined, fd("watsab 20123456"));
    expect(res).toEqual({ sent: true, warned: true, escalated: true, suspended: false });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("SUSPEND (1re fois = temporaire) au-delà du seuil de suspension", async () => {
    mockBooking();
    (prisma.message.count as unknown as Mock).mockResolvedValue(4);
    (prisma.user.findUnique as unknown as Mock).mockResolvedValue({ suspensionCount: 0 });
    const res = await sendMessageAction(undefined, fd("watsab 20123456"));
    expect(res).toEqual({ sent: true, warned: true, escalated: true, suspended: true });
    const upd = (prisma.user.update as unknown as Mock).mock.calls[0][0];
    expect(upd.where).toEqual({ id: "guest1" });
    expect(upd.data.suspended).toBe(true);
    expect(upd.data.suspensionCount).toBe(1);
    // 1re suspension = temporaire (date de fin renseignée, pas indéfinie).
    expect(upd.data.suspendedUntil).toBeInstanceOf(Date);
  });

  it("suspension PROGRESSIVE : la 2e suspension passe au palier suivant", async () => {
    mockBooking();
    (prisma.message.count as unknown as Mock).mockResolvedValue(5);
    (prisma.user.findUnique as unknown as Mock).mockResolvedValue({ suspensionCount: 1 });
    await sendMessageAction(undefined, fd("3aytili 20123456"));
    const upd = (prisma.user.update as unknown as Mock).mock.calls[0][0];
    expect(upd.data.suspensionCount).toBe(2);
    expect(upd.data.suspendedUntil).toBeInstanceOf(Date);
  });

  it("refuse tout envoi si le compte est déjà suspendu", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ id: "guest1", suspended: true });
    const res = await sendMessageAction(undefined, fd("coucou"));
    expect(res).toEqual({ error: "suspendu" });
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it("NE masque PAS une fois la réservation ferme (politique STRICTE = contact débloqué)", async () => {
    mockBooking({ cancelPolicy: "STRICTE" });
    const res = await sendMessageAction(undefined, fd("mon num 20123456"));
    expect(res).toEqual({ sent: true, warned: false, escalated: false, suspended: false });
    const data = (prisma.message.create as unknown as Mock).mock.calls[0][0].data;
    expect(data.flagged).toBe(false);
    expect(data.body).toContain("20123456");
  });

  it("autorise aussi l'hôte de la réservation", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({ id: "host1" });
    mockBooking();
    const res = await sendMessageAction(undefined, fd("Bienvenue !"));
    expect(res).toEqual({ sent: true, warned: false, escalated: false, suspended: false });
  });
});
