/**
 * Tests — gating du contact derrière l'acompte (cœur anti-bypass).
 * Les coordonnées hôte ↔ voyageur ne sont révélées QUE si la réservation est
 * CONFIRMEE/TERMINEE ET que le viewer est une partie de cette réservation.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { booking: { findUnique: vi.fn() } },
}));

import { getRevealedContacts } from "@/lib/contact-reveal";
import { prisma } from "@/lib/prisma";

const GUEST = { name: "Voyageur", email: "guest@ex.com", phone: "+21620000000" };
const HOST = { name: "Hôte", email: "host@ex.com", phone: "+21621111111" };

function booking(status: string) {
  return {
    status,
    guestId: "guest1",
    guest: GUEST,
    property: { ownerId: "host1", owner: HOST },
  };
}

beforeEach(() => vi.clearAllMocks());

describe("getRevealedContacts", () => {
  it("renvoie null si la réservation n'existe pas", async () => {
    (prisma.booking.findUnique as unknown as Mock).mockResolvedValue(null);
    expect(await getRevealedContacts("b1", "guest1")).toBeNull();
  });

  it("renvoie null tant que la réservation n'est pas confirmée (EN_ATTENTE)", async () => {
    (prisma.booking.findUnique as unknown as Mock).mockResolvedValue(booking("EN_ATTENTE"));
    expect(await getRevealedContacts("b1", "guest1")).toBeNull();
  });

  it("renvoie null pour ANNULEE", async () => {
    (prisma.booking.findUnique as unknown as Mock).mockResolvedValue(booking("ANNULEE"));
    expect(await getRevealedContacts("b1", "guest1")).toBeNull();
  });

  it("révèle l'hôte au voyageur une fois CONFIRMEE", async () => {
    (prisma.booking.findUnique as unknown as Mock).mockResolvedValue(booking("CONFIRMEE"));
    expect(await getRevealedContacts("b1", "guest1")).toEqual({
      viewer: "guest",
      counterpart: HOST,
    });
  });

  it("révèle le voyageur à l'hôte une fois TERMINEE", async () => {
    (prisma.booking.findUnique as unknown as Mock).mockResolvedValue(booking("TERMINEE"));
    expect(await getRevealedContacts("b1", "host1")).toEqual({
      viewer: "host",
      counterpart: GUEST,
    });
  });

  it("renvoie null pour un tiers étranger à la réservation, même confirmée", async () => {
    (prisma.booking.findUnique as unknown as Mock).mockResolvedValue(booking("CONFIRMEE"));
    expect(await getRevealedContacts("b1", "intrus")).toBeNull();
  });
});
