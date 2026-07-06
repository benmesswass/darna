/**
 * Rail 2 — paiement sur place (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP3).
 *
 * Couvre les garde-fous explicitement demandés par le prompt PSP3 :
 *  - createBookingAction ne bascule JAMAIS en mode SUR_PLACE sans que la
 *    propriété l'ait activé, ni sans KYC VERIFIE (strict, pas DEMO_VERIFIE).
 *  - acceptCashBookingAction / declineCashBookingAction / reportNoShowAction
 *    sont réservées au propriétaire de l'annonce (IDOR).
 *  - L'acceptation génère la HostInvoice (amount = serviceFee) dans la même
 *    transaction que la confirmation.
 *  - Le signalement de no-show est idempotent (updateMany conditionné).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn() },
    booking: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    hostInvoice: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ sendBookingConfirmationEmail: vi.fn() }));
vi.mock("@/lib/notification-center", () => ({
  notifyBookingConfirmed: vi.fn(),
  notifyCashBookingRequested: vi.fn(),
  notifyCashBookingDeclined: vi.fn(),
}));
vi.mock("@/lib/suspension", () => ({
  isSuspended: vi.fn(() => false),
  applySuspension: vi.fn().mockResolvedValue({ level: 1, until: new Date() }),
}));
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
      cashNonDisponible: "Paiement sur place indisponible.",
      cashKycRequis: "KYC requis.",
      demandeIndisponible: "Demande indisponible.",
      demandeExpiree: "Demande expirée.",
      demandeAcceptee: "Réservation confirmée !",
      demandeRefusee: "Demande refusée.",
      noShowIndisponible: "Action indisponible.",
      noShowSignale: "Absence signalée.",
    },
    common: { erreurInconnue: "Erreur inconnue." },
  }),
}));

import {
  createBookingAction,
  acceptCashBookingAction,
  declineCashBookingAction,
  reportNoShowAction,
} from "@/actions/bookings";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { applySuspension } from "@/lib/suspension";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const bookingFindUnique = prisma.booking.findUnique as unknown as Mock;
const bookingUpdate = prisma.booking.update as unknown as Mock;
const bookingUpdateMany = prisma.booking.updateMany as unknown as Mock;
const hostInvoiceCreate = prisma.hostInvoice.create as unknown as Mock;
const txRun = prisma.$transaction as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const applySuspensionMock = applySuspension as unknown as Mock;

const DAY = 24 * 60 * 60 * 1000;
const GUEST_ID = "guest-1";
const OWNER_ID = "owner-1";
const ATTACKER_ID = "attacker-1";
const BOOKING_ID = "clbooking0000000000000001";

function ymd(offset: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function cashBookingForm(): FormData {
  const fd = new FormData();
  fd.set("slug", "villa-hammamet-abc123");
  fd.set("arrivee", ymd(10));
  fd.set("depart", ymd(12));
  fd.set("voyageurs", "2");
  fd.set("paymentMode", "SUR_PLACE");
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

const cashEnabledProperty = {
  id: "clproperty000000000000001",
  type: "SEJOUR",
  status: "ACTIVE",
  expiresAt: new Date(Date.now() + 30 * DAY),
  price: 100,
  stay: { maxGuests: 4 },
  ownerId: OWNER_ID,
  cashPaymentEnabled: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue(verifiedGuest);
  propertyFindUnique.mockResolvedValue(cashEnabledProperty);
});

describe("createBookingAction — éligibilité Rail 2", () => {
  it("refuse le mode SUR_PLACE si la propriété n'a pas activé le paiement sur place", async () => {
    propertyFindUnique.mockResolvedValue({ ...cashEnabledProperty, cashPaymentEnabled: false });

    const result = await createBookingAction(undefined, cashBookingForm());

    expect(result).toEqual({ error: "Paiement sur place indisponible." });
    expect(txRun).not.toHaveBeenCalled();
  });

  it("refuse le mode SUR_PLACE si le voyageur n'a pas kycStatus VERIFIE (DEMO_VERIFIE ne suffit pas)", async () => {
    requireUserMock.mockResolvedValue({ ...verifiedGuest, kycStatus: "DEMO_VERIFIE" });

    const result = await createBookingAction(undefined, cashBookingForm());

    expect(result).toEqual({ error: "KYC requis." });
    expect(txRun).not.toHaveBeenCalled();
  });

  it("crée une demande EN_ATTENTE_ACCEPTATION quand l'annonce et le voyageur sont éligibles", async () => {
    const create = vi.fn().mockResolvedValue({ id: BOOKING_ID });
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        booking: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), create },
        property: { findFirst: vi.fn().mockResolvedValue(null) },
      })
    );

    const result = await createBookingAction(undefined, cashBookingForm());

    expect(result).toBeUndefined(); // succès → redirect (mocké)
    expect(create.mock.calls[0][0]).toMatchObject({
      data: {
        guestId: GUEST_ID,
        paymentMode: "SUR_PLACE",
        status: "EN_ATTENTE_ACCEPTATION",
        depositAmount: 0,
      },
    });
  });
});

describe("acceptCashBookingAction — IDOR + génération HostInvoice", () => {
  const pendingBooking = (ownerId: string) => ({
    id: BOOKING_ID,
    status: "EN_ATTENTE_ACCEPTATION",
    paymentMode: "SUR_PLACE",
    serviceFee: 16,
    checkOut: new Date(Date.now() + 12 * DAY),
    expiresAt: new Date(Date.now() + DAY),
    property: { ownerId, slug: "villa-hammamet" },
  });

  function idForm(): FormData {
    const fd = new FormData();
    fd.set("bookingId", BOOKING_ID);
    return fd;
  }

  it("refuse l'acceptation par un utilisateur autre que le propriétaire", async () => {
    requireUserMock.mockResolvedValue({ id: ATTACKER_ID });
    bookingFindUnique.mockResolvedValue(pendingBooking(OWNER_ID));

    const result = await acceptCashBookingAction(undefined, idForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(txRun).not.toHaveBeenCalled();
  });

  it("accepte, confirme la réservation ET génère la HostInvoice (amount = serviceFee)", async () => {
    requireUserMock.mockResolvedValue({ id: OWNER_ID });
    bookingFindUnique.mockResolvedValue(pendingBooking(OWNER_ID));
    bookingUpdate.mockResolvedValue({});
    hostInvoiceCreate.mockResolvedValue({});
    txRun.mockImplementation(async (ops: unknown[]) => Promise.all(ops));

    const result = await acceptCashBookingAction(undefined, idForm());

    expect(result).toEqual({ success: "Réservation confirmée !" });
    expect(bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CONFIRMEE",
          escrow: "AUCUN",
          amountPaid: 0,
          depositAmount: 0,
        }),
      })
    );
    expect(hostInvoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: BOOKING_ID,
          hostId: OWNER_ID,
          amount: 16,
        }),
      })
    );
  });

  it("refuse d'accepter une demande déjà traitée (statut différent)", async () => {
    requireUserMock.mockResolvedValue({ id: OWNER_ID });
    bookingFindUnique.mockResolvedValue({ ...pendingBooking(OWNER_ID), status: "CONFIRMEE" });

    const result = await acceptCashBookingAction(undefined, idForm());

    expect(result).toEqual({ error: "Demande indisponible." });
    expect(txRun).not.toHaveBeenCalled();
  });
});

describe("declineCashBookingAction — IDOR", () => {
  const pendingBooking = (ownerId: string) => ({
    id: BOOKING_ID,
    status: "EN_ATTENTE_ACCEPTATION",
    paymentMode: "SUR_PLACE",
    property: { ownerId, slug: "villa-hammamet" },
  });

  function idForm(): FormData {
    const fd = new FormData();
    fd.set("bookingId", BOOKING_ID);
    return fd;
  }

  it("refuse le refus par un utilisateur autre que le propriétaire", async () => {
    requireUserMock.mockResolvedValue({ id: ATTACKER_ID });
    bookingFindUnique.mockResolvedValue(pendingBooking(OWNER_ID));

    const result = await declineCashBookingAction(undefined, idForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("autorise le propriétaire à refuser (contrôle positif) — libère les dates", async () => {
    requireUserMock.mockResolvedValue({ id: OWNER_ID });
    bookingFindUnique.mockResolvedValue(pendingBooking(OWNER_ID));
    bookingUpdate.mockResolvedValue({});

    const result = await declineCashBookingAction(undefined, idForm());

    expect(result).toEqual({ success: "Demande refusée." });
    expect(bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "ANNULEE", expiresAt: null } })
    );
    expect(hostInvoiceCreate).not.toHaveBeenCalled();
  });
});

describe("reportNoShowAction — IDOR + idempotence", () => {
  const confirmedCashBooking = (ownerId: string, checkInOffsetDays: number) => ({
    id: BOOKING_ID,
    status: "CONFIRMEE",
    paymentMode: "SUR_PLACE",
    checkIn: new Date(Date.now() + checkInOffsetDays * DAY),
    guestId: GUEST_ID,
    property: { ownerId },
  });

  function idForm(): FormData {
    const fd = new FormData();
    fd.set("bookingId", BOOKING_ID);
    return fd;
  }

  it("refuse le signalement par un utilisateur autre que le propriétaire", async () => {
    requireUserMock.mockResolvedValue({ id: ATTACKER_ID });
    bookingFindUnique.mockResolvedValue(confirmedCashBooking(OWNER_ID, -2));

    const result = await reportNoShowAction(undefined, idForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("refuse le signalement si le check-in n'est pas encore passé", async () => {
    requireUserMock.mockResolvedValue({ id: OWNER_ID });
    bookingFindUnique.mockResolvedValue(confirmedCashBooking(OWNER_ID, 2));

    const result = await reportNoShowAction(undefined, idForm());

    expect(result).toEqual({ error: "Action indisponible." });
    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("signale l'absence : bascule TERMINEE et suspend le voyageur", async () => {
    requireUserMock.mockResolvedValue({ id: OWNER_ID });
    bookingFindUnique.mockResolvedValue(confirmedCashBooking(OWNER_ID, -2));
    bookingUpdateMany.mockResolvedValue({ count: 1 });

    const result = await reportNoShowAction(undefined, idForm());

    expect(result).toEqual({ success: "Absence signalée." });
    expect(bookingUpdateMany).toHaveBeenCalledWith({
      where: { id: BOOKING_ID, status: "CONFIRMEE" },
      data: { status: "TERMINEE" },
    });
    expect(applySuspensionMock).toHaveBeenCalledWith(
      GUEST_ID,
      expect.objectContaining({ bookingId: BOOKING_ID })
    );
  });

  it("est idempotent : un second signalement (déjà TERMINEE en base) est rejeté", async () => {
    requireUserMock.mockResolvedValue({ id: OWNER_ID });
    bookingFindUnique.mockResolvedValue(confirmedCashBooking(OWNER_ID, -2));
    // Concurrence/double clic : updateMany conditionné sur status=CONFIRMEE ne
    // matche plus rien (déjà basculé par le premier appel).
    bookingUpdateMany.mockResolvedValue({ count: 0 });

    const result = await reportNoShowAction(undefined, idForm());

    expect(result).toEqual({ error: "Action indisponible." });
    expect(applySuspensionMock).not.toHaveBeenCalled();
  });
});
