/**
 * Tests — listConversations / countUnreadMessages : la logique de mapping de la
 * messagerie centralisée (détection du rôle viewer, nom de l'autre partie, tri
 * par dernier message, report des non-lus groupés). Prisma est mocké.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    message: { count: vi.fn(), groupBy: vi.fn() },
    booking: { findMany: vi.fn() },
  },
}));

import { listConversations, countUnreadMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";

beforeEach(() => vi.clearAllMocks());

describe("countUnreadMessages", () => {
  it("compte les messages non lus reçus (senderId ≠ moi, readAt null)", async () => {
    (prisma.message.count as unknown as Mock).mockResolvedValue(3);
    await expect(countUnreadMessages("u1")).resolves.toBe(3);
    const where = (prisma.message.count as unknown as Mock).mock.calls[0][0].where;
    expect(where.readAt).toBeNull();
    expect(where.senderId).toEqual({ not: "u1" });
    expect(where.booking.OR).toEqual([
      { guestId: "u1" },
      { property: { ownerId: "u1" } },
    ]);
  });
});

describe("listConversations", () => {
  it("renvoie [] sans requête de non-lus quand aucun fil", async () => {
    (prisma.booking.findMany as unknown as Mock).mockResolvedValue([]);
    await expect(listConversations("u1")).resolves.toEqual([]);
    expect(prisma.message.groupBy).not.toHaveBeenCalled();
  });

  it("mappe le viewer/l'autre partie, trie par dernier message et reporte les non-lus", async () => {
    // u1 est VOYAGEUR de b1 (autre = hôte) et HÔTE de b2 (autre = voyageur).
    (prisma.booking.findMany as unknown as Mock).mockResolvedValue([
      {
        id: "b1",
        guestId: "u1",
        property: { title: "Villa", ownerId: "host9", owner: { name: "Hôte Karim" } },
        guest: { name: "Moi" },
        messages: [{ body: "Vieux", createdAt: new Date("2026-01-01"), senderId: "host9" }],
      },
      {
        id: "b2",
        guestId: "guest7",
        property: { title: "Studio", ownerId: "u1", owner: { name: "Moi" } },
        guest: { name: "Voyageur Sami" },
        messages: [{ body: "Récent", createdAt: new Date("2026-02-01"), senderId: "u1" }],
      },
    ]);
    (prisma.message.groupBy as unknown as Mock).mockResolvedValue([
      { bookingId: "b1", _count: { _all: 2 } },
    ]);

    const res = await listConversations("u1");

    // Trié par dernier message décroissant → b2 (févr.) avant b1 (janv.).
    expect(res.map((c) => c.bookingId)).toEqual(["b2", "b1"]);

    const b1 = res.find((c) => c.bookingId === "b1")!;
    expect(b1.viewer).toBe("guest");
    expect(b1.otherName).toBe("Hôte Karim");
    expect(b1.unread).toBe(2);
    expect(b1.lastMine).toBe(false);

    const b2 = res.find((c) => c.bookingId === "b2")!;
    expect(b2.viewer).toBe("host");
    expect(b2.otherName).toBe("Voyageur Sami");
    expect(b2.unread).toBe(0); // absent du groupBy
    expect(b2.lastMine).toBe(true);
  });
});
