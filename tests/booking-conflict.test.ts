/**
 * D1 (QA_ROADMAP §3) — Anti double-réservation.
 *
 * Le garde-fou réel vit dans createBookingAction : une transaction SERIALIZABLE
 * (bookings.ts:140-187) qui vérifie le conflit DANS la transaction puis crée la
 * réservation. Ce test prouve le comportement du garde-fou (création quand libre,
 * rejet quand chevauchement, et — simulé — un seul gagnant sous concurrence).
 *
 * Note : la VRAIE concurrence (deux transactions PostgreSQL en parallèle) relève
 * d'un test d'intégration sur Postgres éphémère (cf. TODO-BETA). Ici on isole la
 * logique de détection de conflit que la transaction exécute.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => false),
  initKonnectPayment: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    booking: {
      verifRequise: "Vérification requise.",
      datesInvalides: "Dates invalides.",
      datesIndisponibles: "Dates indisponibles.",
      proprietaireImpossible: "Impossible de réserver son propre logement.",
      capaciteDepassee: (n: number) => `Capacité dépassée (${n}).`,
    },
    common: { erreurInconnue: "Erreur inconnue." },
  }),
}));

import { createBookingAction } from "@/actions/bookings";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logStructured } from "@/lib/audit";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const txRun = prisma.$transaction as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const logStructuredMock = logStructured as unknown as Mock;

const GUEST_ID = "guest-1";
const OWNER_ID = "owner-1";
const BOOKING_ID = "clbooking0000000000000001";
const DAY = 24 * 60 * 60 * 1000;

/** Jour civil UTC décalé de `offset` jours, format YYYY-MM-DD. */
function ymd(offset: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

/** FormData d'une réservation valide (séjour de 2 nuits, 2 voyageurs). */
function bookingForm(): FormData {
  const fd = new FormData();
  fd.set("slug", "villa-hammamet-abc123");
  fd.set("arrivee", ymd(10));
  fd.set("depart", ymd(12));
  fd.set("voyageurs", "2");
  return fd;
}

const verifiedGuest = {
  id: GUEST_ID,
  name: "Voyageur Test",
  email: "guest@test.tn",
  phone: null,
  image: null,
  role: "VOYAGEUR",
  kycStatus: "VERIFIE",
  phoneVerified: true,
  emailVerified: true,
  isWakil: false,
};

const activeProperty = {
  id: "clproperty000000000000001",
  type: "SEJOUR",
  status: "ACTIVE",
  expiresAt: new Date(Date.now() + 30 * DAY),
  price: 100,
  stay: { maxGuests: 4 },
  ownerId: OWNER_ID,
};

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue(verifiedGuest);
  propertyFindUnique.mockResolvedValue(activeProperty);
});

describe("createBookingAction — anti double-réservation", () => {
  it("crée la réservation quand le créneau est libre (prix recalculé côté serveur)", async () => {
    const create = vi.fn().mockResolvedValue({ id: BOOKING_ID });
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        booking: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), create },
        property: { findFirst: vi.fn().mockResolvedValue(null) },
      })
    );

    const result = await createBookingAction(undefined, bookingForm());

    expect(result).toBeUndefined(); // succès → redirect (mocké)
    expect(create).toHaveBeenCalledTimes(1);
    // Prix figés par le serveur : 100 × 2 nuits = 200, frais 8 % = 16, total 216.
    // Aucun champ prix n'est accepté du client (createSchema ne l'expose pas).
    expect(create.mock.calls[0][0]).toMatchObject({
      data: {
        guestId: GUEST_ID,
        status: "EN_ATTENTE",
        nightlyPrice: 100,
        serviceFee: 16,
        totalPrice: 216,
      },
    });
  });

  it("rejette une réservation qui chevauche un créneau déjà pris (conflit)", async () => {
    const create = vi.fn();
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        booking: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), create },
        // Un créneau bloquant existe → la transaction lève BookingConflictError.
        property: { findFirst: vi.fn().mockResolvedValue({ id: activeProperty.id }) },
      })
    );

    const result = await createBookingAction(undefined, bookingForm());

    expect(result).toEqual({ error: "Dates indisponibles." });
    expect(create).not.toHaveBeenCalled();
    expect(logStructuredMock).toHaveBeenCalledWith(
      "warn",
      "booking.conflict",
      expect.any(Object)
    );
  });

  it("concurrence : sur deux réservations qui se chevauchent, une seule est créée", async () => {
    // État partagé simulant la base : dès qu'un créneau est pris, la vérification
    // de conflit suivante le voit (exactement ce que garantit la transaction).
    let slotTaken = false;
    const created: string[] = [];

    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        booking: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          create: vi.fn().mockImplementation(async () => {
            slotTaken = true;
            const id = `clbooking000000000000000${created.length + 1}`;
            created.push(id);
            return { id };
          }),
        },
        property: {
          findFirst: vi.fn().mockImplementation(async () =>
            slotTaken ? { id: activeProperty.id } : null
          ),
        },
      })
    );

    const first = await createBookingAction(undefined, bookingForm());
    const second = await createBookingAction(undefined, bookingForm());

    expect(created).toHaveLength(1); // un seul gagnant
    expect(first).toBeUndefined(); // 1ʳᵉ : succès → redirect
    expect(second).toEqual({ error: "Dates indisponibles." }); // 2ᵉ : rejetée
  });
});
