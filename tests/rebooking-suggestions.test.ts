/**
 * AHC6 (ANNULATION_HOTE_CORRECTIFS_ROADMAP.md) — amortir le relogement
 * last-minute.
 *
 * Prouve la FENÊTRE ±2 jours de getRebookingSuggestions : une annonce dont les
 * dates EXACTES sont prises mais qui se libère à ±2 jours reste suggérée (elle
 * était exclue avant), tandis qu'une annonce prise sur toute l'enveloppe est
 * bien écartée. Vérifie aussi l'élargissement géographique à 5 villes voisines.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { property: { findMany: vi.fn() }, booking: { findMany: vi.fn() } },
}));
vi.mock("@/lib/geo", () => ({
  resolveCity: vi.fn((c: string) => c),
  nearbyCities: vi.fn(() => [{ name: "Nabeul" }, { name: "Sousse" }]),
}));
// listings.ts importe session/product-events (§IN1, SEARCH_PERFORMED) — mocké
// ici pour ne jamais charger next-auth pour de vrai dans ce test, sans rapport.
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/product-events", () => ({ getAnonId: vi.fn(), logProductEvent: vi.fn() }));

import { getRebookingSuggestions, getHostCancellationSignals } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { nearbyCities } from "@/lib/geo";
import { HOST_CANCELLATION_SIGNAL_DAYS } from "@/lib/config";

const findMany = prisma.property.findMany as unknown as Mock;
const bookingFindMany = prisma.booking.findMany as unknown as Mock;
const nearbyCitiesMock = nearbyCities as unknown as Mock;

const DAY = 24 * 60 * 60 * 1000;
const base = new Date("2026-08-20T00:00:00.000Z").getTime();
const d = (offsetDays: number) => new Date(base + offsetDays * DAY);

const booking = {
  propertyId: "prop-cancelled",
  city: "Hammamet",
  guests: 2,
  checkIn: d(0),
  checkOut: d(3), // séjour de 3 nuits
  nightlyPrice: 300,
};

function candidate(id: string) {
  return { id, city: "Hammamet", price: 300, photos: [], stay: { maxGuests: 4 }, reviews: [] };
}

beforeEach(() => {
  vi.clearAllMocks();
  bookingFindMany.mockResolvedValue([]);
});

describe("getRebookingSuggestions — fenêtre ±2 jours (§AHC6)", () => {
  it("inclut une annonce libre seulement APRÈS un décalage (dates exactes prises)", async () => {
    // p-shiftable est réservée [J-2, J+1] : les dates exactes [J0, J+3]
    // chevauchent, mais un décalage +2 → [J+2, J+5] est libre → suggérée.
    // p-full est prise sur toute l'enveloppe [J-2, J+5] → aucun décalage libre.
    findMany.mockResolvedValue([candidate("p-free"), candidate("p-shiftable"), candidate("p-full")]);
    bookingFindMany.mockResolvedValue([
      { propertyId: "p-shiftable", checkIn: d(-2), checkOut: d(1) },
      { propertyId: "p-full", checkIn: d(-2), checkOut: d(5) },
    ]);

    const result = await getRebookingSuggestions(booking);
    const ids = result.map((r) => r.id);

    expect(ids).toContain("p-free");
    expect(ids).toContain("p-shiftable"); // récupérée par la fenêtre ±2
    expect(ids).not.toContain("p-full"); // prise sur toute l'enveloppe
  });

  it("n'expose jamais de champ `bookings` dans le résultat (dates d'autrui)", async () => {
    findMany.mockResolvedValue([candidate("p-free")]);
    const result = await getRebookingSuggestions(booking);
    expect(result[0]).not.toHaveProperty("bookings");
  });

  it("élargit la recherche à 5 villes voisines (§AHC6)", async () => {
    findMany.mockResolvedValue([]);
    await getRebookingSuggestions(booking);
    expect(nearbyCitiesMock).toHaveBeenCalledWith("Hammamet", 5);
  });
});

describe("getHostCancellationSignals — signal réputationnel §AHC7", () => {
  const bookingFindMany2 = prisma.booking.findMany as unknown as Mock;

  it("interroge dans la fenêtre glissante configurée, scopée à CETTE annonce", async () => {
    bookingFindMany2.mockResolvedValue([]);
    await getHostCancellationSignals("prop-1");

    expect(bookingFindMany2).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          propertyId: "prop-1",
          cancelledByHostAt: { gte: expect.any(Date) },
        }),
      })
    );
    const cutoff = bookingFindMany2.mock.calls[0][0].where.cancelledByHostAt.gte as Date;
    const expected = Date.now() - HOST_CANCELLATION_SIGNAL_DAYS * DAY;
    expect(Math.abs(cutoff.getTime() - expected)).toBeLessThan(5000);
  });

  it("renvoie id + dates du séjour — jamais le voyageur concerné (vie privée)", async () => {
    bookingFindMany2.mockResolvedValue([
      {
        id: "bk1",
        cancelledByHostAt: new Date("2026-06-01T00:00:00.000Z"),
        checkIn: new Date("2026-06-10T00:00:00.000Z"),
        checkOut: new Date("2026-06-13T00:00:00.000Z"),
      },
    ]);

    const result = await getHostCancellationSignals("prop-1");

    expect(result).toEqual([
      {
        id: "bk1",
        cancelledAt: "2026-06-01T00:00:00.000Z",
        checkIn: "2026-06-10T00:00:00.000Z",
        checkOut: "2026-06-13T00:00:00.000Z",
      },
    ]);
    // select ne demande que id + dates — jamais guestId/guest.
    const selectArg = bookingFindMany2.mock.calls[0][0].select;
    expect(selectArg).toEqual({
      id: true,
      cancelledByHostAt: true,
      checkIn: true,
      checkOut: true,
    });
  });
});
