/**
 * PM0 (CROISSANCE_ROADMAP.md) — le prix promo hôte, quand actif, remplace le
 * prix normal au calcul du sous-total : au devis (quoteBookingAction) ET à la
 * création (createBookingAction) — même garde aux deux endroits (leçon D11 de
 * QA_ROADMAP.md : un des deux avait été oublié pour cancelBlockedUntil).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn(), getSessionUser: vi.fn() }));
vi.mock("@/lib/host-invoicing", () => ({ hasOverdueHostInvoice: vi.fn(() => false) }));
vi.mock("@/lib/suspension", () => ({ isSuspended: vi.fn(() => false) }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/konnect", () => ({ isKonnectEnabled: vi.fn(() => false) }));
vi.mock("@/lib/notification-center", () => ({ notifyCashBookingRequested: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    booking: {
      verifRequise: "Vérification requise.",
      datesInvalides: "Dates invalides.",
      datesIndisponibles: "Dates indisponibles.",
      proprietaireImpossible: "Impossible.",
      capaciteDepassee: (n: number) => `Capacité dépassée (${n}).`,
      cashNonDisponible: "Cash indisponible.",
      cashKycRequis: "KYC requis.",
      compteSuspendu: "Compte suspendu.",
    },
  }),
}));

import { createBookingAction, quoteBookingAction } from "@/actions/bookings";
import { prisma } from "@/lib/prisma";
import { requireUser, getSessionUser } from "@/lib/session";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const propertyFindFirst = prisma.property.findFirst as unknown as Mock;
const txRun = prisma.$transaction as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const getSessionUserMock = getSessionUser as unknown as Mock;

const DAY = 24 * 60 * 60 * 1000;
const GUEST_ID = "guest-1";
const SLUG = "villa-hammamet-abc123";

const verifiedGuest = {
  id: GUEST_ID,
  role: "VOYAGEUR",
  kycStatus: "VERIFIE",
  phoneVerified: true,
  emailVerified: true,
};

function ymd(offset: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function baseProperty(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "clproperty000000000000001",
    type: "SEJOUR",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 30 * DAY),
    price: 300,
    verified: true,
    promoPrice: null,
    promoUntil: null,
    stay: { maxGuests: 4 },
    ownerId: "owner-1",
    cashPaymentEnabled: false,
    cancelBlockedUntil: null,
    ...overrides,
  };
}

function quoteInput() {
  return { slug: SLUG, arrivee: ymd(10), depart: ymd(12), voyageurs: 2 }; // 2 nuits
}

function bookingForm(): FormData {
  const fd = new FormData();
  fd.set("slug", SLUG);
  fd.set("arrivee", ymd(10));
  fd.set("depart", ymd(12));
  fd.set("voyageurs", "2");
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue(verifiedGuest);
  getSessionUserMock.mockResolvedValue(null);
  propertyFindFirst.mockResolvedValue(null); // aucun conflit de dates
});

describe("quoteBookingAction — prix promo (§PM0)", () => {
  it("utilise le prix normal quand aucune promo n'est active", async () => {
    propertyFindUnique.mockResolvedValue(baseProperty());

    const quote = await quoteBookingAction(quoteInput());

    expect(quote).toMatchObject({ ok: true, subtotal: 600, serviceFee: 48 }); // 300 * 2 nuits
  });

  it("utilise le prix promo quand actif et l'annonce vérifiée", async () => {
    propertyFindUnique.mockResolvedValue(
      baseProperty({ promoPrice: 200, promoUntil: new Date(Date.now() + DAY) })
    );

    const quote = await quoteBookingAction(quoteInput());

    expect(quote).toMatchObject({ ok: true, subtotal: 400, serviceFee: 32 }); // 200 * 2 nuits
  });

  it("ignore une promo expirée (lazy-expiry, aucun cron)", async () => {
    propertyFindUnique.mockResolvedValue(
      baseProperty({ promoPrice: 200, promoUntil: new Date(Date.now() - DAY) })
    );

    const quote = await quoteBookingAction(quoteInput());

    expect(quote).toMatchObject({ ok: true, subtotal: 600 });
  });

  it("ignore la promo si l'annonce n'est plus vérifiée", async () => {
    propertyFindUnique.mockResolvedValue(
      baseProperty({ promoPrice: 200, promoUntil: new Date(Date.now() + DAY), verified: false })
    );

    const quote = await quoteBookingAction(quoteInput());

    expect(quote).toMatchObject({ ok: true, subtotal: 600 });
  });
});

describe("createBookingAction — prix promo (§PM0)", () => {
  it("stocke nightlyPrice/subtotal calculés sur le prix promo actif, jamais un prix client", async () => {
    propertyFindUnique.mockResolvedValue(
      baseProperty({ promoPrice: 200, promoUntil: new Date(Date.now() + DAY) })
    );
    const create = vi.fn().mockResolvedValue({ id: "clbooking0000000000000001", totalPrice: 432 });
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        booking: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), create, update: vi.fn() },
        property: { findFirst: vi.fn().mockResolvedValue(null) },
      })
    );

    await createBookingAction(undefined, bookingForm());

    expect(create.mock.calls[0][0].data).toMatchObject({
      nightlyPrice: 200,
      serviceFee: 32,
      totalPrice: 432,
    });
  });

  it("ignore la promo si l'annonce n'est plus vérifiée (re-vérifié à la réservation, pas seulement à la pose)", async () => {
    propertyFindUnique.mockResolvedValue(
      baseProperty({
        promoPrice: 200,
        promoUntil: new Date(Date.now() + DAY),
        verified: false,
      })
    );
    const create = vi.fn().mockResolvedValue({ id: "clbooking0000000000000001", totalPrice: 648 });
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        booking: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), create, update: vi.fn() },
        property: { findFirst: vi.fn().mockResolvedValue(null) },
      })
    );

    await createBookingAction(undefined, bookingForm());

    expect(create.mock.calls[0][0].data).toMatchObject({ nightlyPrice: 300 });
  });
});
