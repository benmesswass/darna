/**
 * Tests — gating du contact (acompte réglé + fin de la fenêtre d'annulation
 * gratuite). Les coordonnées ne sont révélées qu'une fois qu'annuler n'est plus
 * gratuit ; avant, elles sont « verrouillées » avec une date de déblocage.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { booking: { findUnique: vi.fn() } },
}));

import { getRevealedContacts, contactRevealState } from "@/lib/contact-reveal";
import { prisma } from "@/lib/prisma";

const DAY = 86_400_000;
const GUEST = { name: "Voyageur", email: "guest@ex.com", phone: "+21620000000" };
const HOST = { name: "Hôte", email: "host@ex.com", phone: "+21621111111" };
const NOW = new Date("2026-06-01T00:00:00.000Z");

function bookingRow(status: string, checkIn: Date, cancelPolicy: string) {
  return {
    status,
    guestId: "guest1",
    checkIn,
    guest: GUEST,
    property: { ownerId: "host1", cancelPolicy, owner: HOST },
  };
}

beforeEach(() => vi.clearAllMocks());

describe("contactRevealState (pur)", () => {
  const far = new Date(NOW.getTime() + 20 * DAY); // check-in dans 20 j

  it("caché tant que la réservation n'est pas confirmée", () => {
    expect(contactRevealState("EN_ATTENTE", far, "MODEREE", NOW).state).toBe("hidden");
  });

  it("révélé dès la confirmation si aucune annulation gratuite (STRICTE)", () => {
    expect(contactRevealState("CONFIRMEE", far, "STRICTE", NOW).state).toBe("revealed");
  });

  it("verrouillé pendant la fenêtre gratuite, déblocage = check-in − 5 j (MODEREE)", () => {
    const r = contactRevealState("CONFIRMEE", far, "MODEREE", NOW);
    expect(r.state).toBe("locked");
    if (r.state === "locked") {
      expect(r.revealAt.getTime()).toBe(far.getTime() - 5 * DAY);
    }
  });

  it("révélé une fois la fenêtre gratuite passée", () => {
    const justBeforeCheckIn = new Date(far.getTime() - 3 * DAY); // < 5 j avant
    expect(contactRevealState("CONFIRMEE", far, "MODEREE", justBeforeCheckIn).state).toBe(
      "revealed"
    );
  });

  it("TERMINEE → révélé (séjour passé)", () => {
    const past = new Date(NOW.getTime() - 10 * DAY);
    expect(contactRevealState("TERMINEE", past, "MODEREE", NOW).state).toBe("revealed");
  });
});

describe("getRevealedContacts", () => {
  const far = new Date(NOW.getTime() + 20 * DAY);

  it("null si la réservation n'existe pas", async () => {
    (prisma.booking.findUnique as unknown as Mock).mockResolvedValue(null);
    expect(await getRevealedContacts("b1", "guest1", NOW)).toBeNull();
  });

  it("null tant que non confirmée (EN_ATTENTE)", async () => {
    (prisma.booking.findUnique as unknown as Mock).mockResolvedValue(
      bookingRow("EN_ATTENTE", far, "MODEREE")
    );
    expect(await getRevealedContacts("b1", "guest1", NOW)).toBeNull();
  });

  it("null pour un tiers étranger, même confirmée", async () => {
    (prisma.booking.findUnique as unknown as Mock).mockResolvedValue(
      bookingRow("CONFIRMEE", far, "STRICTE")
    );
    expect(await getRevealedContacts("b1", "intrus", NOW)).toBeNull();
  });

  it("verrouillé pour le voyageur pendant la fenêtre gratuite", async () => {
    (prisma.booking.findUnique as unknown as Mock).mockResolvedValue(
      bookingRow("CONFIRMEE", far, "MODEREE")
    );
    const r = await getRevealedContacts("b1", "guest1", NOW);
    expect(r).toEqual({
      state: "locked",
      viewer: "guest",
      revealAt: new Date(far.getTime() - 5 * DAY),
    });
  });

  it("révèle l'hôte au voyageur une fois la fenêtre passée (STRICTE = immédiat)", async () => {
    (prisma.booking.findUnique as unknown as Mock).mockResolvedValue(
      bookingRow("CONFIRMEE", far, "STRICTE")
    );
    expect(await getRevealedContacts("b1", "guest1", NOW)).toEqual({
      state: "revealed",
      viewer: "guest",
      counterpart: HOST,
    });
  });

  it("révèle le voyageur à l'hôte une fois TERMINEE", async () => {
    const past = new Date(NOW.getTime() - 10 * DAY);
    (prisma.booking.findUnique as unknown as Mock).mockResolvedValue(
      bookingRow("TERMINEE", past, "MODEREE")
    );
    expect(await getRevealedContacts("b1", "host1", NOW)).toEqual({
      state: "revealed",
      viewer: "host",
      counterpart: GUEST,
    });
  });
});
