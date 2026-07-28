/**
 * LANCEMENT_ROADMAP.md §L5.3 — garantie non-conformité, volet voyageur.
 * reportNonConformityAction : fenêtre checkIn → checkIn+24h, IDOR (garde
 * booking.guestId === user.id, jamais confiance au client), un seul
 * signalement par réservation (contrainte unique bookingId — le pré-check
 * ET la contrainte DB sont testés séparément). N'est jamais un remboursement
 * automatique : ouvre juste un dossier RECU (cf. tests/admin-non-conformity.test.ts
 * pour la suite du circuit).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    nonConformityReport: { create: vi.fn() },
    review: { create: vi.fn() },
  },
}));
vi.mock("@/lib/listings", () => ({ recomputePropertyRating: vi.fn() }));
vi.mock("@/lib/notifications", () => ({
  sendBookingConfirmationEmail: vi.fn(),
  sendNewBookingHostEmail: vi.fn(),
}));
vi.mock("@/lib/notification-center", () => ({
  notifyBookingConfirmed: vi.fn(),
  notifyBookingCancelled: vi.fn(),
  notifyReviewReceived: vi.fn(),
  notifyGuestReviewReceived: vi.fn(),
  notifyNewBookingReceived: vi.fn(),
  notifyNonConformityReported: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/product-events", () => ({ logProductEvent: vi.fn() }));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => false),
  initKonnectPayment: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    booking: {
      signalementIndisponible:
        "Ce signalement n'est disponible que dans les 24 h suivant votre arrivée.",
      signalementDejaEnvoye: "Un signalement a déjà été déposé pour cette réservation.",
      signalementEnvoye: "Signalement envoyé — notre équipe l'examine.",
    },
    common: { erreurInconnue: "Erreur inconnue.", champsRequis: "Champs requis." },
  }),
}));

import { reportNonConformityAction } from "@/actions/bookings";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { logProductEvent } from "@/lib/product-events";
import { notifyNonConformityReported } from "@/lib/notification-center";

const bookingFindUnique = prisma.booking.findUnique as unknown as Mock;
const reportCreate = prisma.nonConformityReport.create as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;
const logProductEventMock = logProductEvent as unknown as Mock;
const notifyReportedMock = notifyNonConformityReported as unknown as Mock;

const OWNER = { id: "guest-owner" };
const ATTACKER = { id: "guest-attacker" };
const BOOKING_ID = "clbooking0000000000000001";
const HOUR = 60 * 60 * 1000;

function reportForm(overrides: Partial<Record<string, string>> = {}): FormData {
  const fd = new FormData();
  fd.set("bookingId", BOOKING_ID);
  fd.set("category", overrides.category ?? "ANNONCE_TROMPEUSE");
  fd.set(
    "description",
    overrides.description ?? "Le logement n'a rien à voir avec les photos de l'annonce."
  );
  return fd;
}

function booking(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: BOOKING_ID,
    guestId: OWNER.id,
    status: "CONFIRMEE",
    checkIn: new Date(Date.now() - 2 * HOUR), // check-in il y a 2h — dans la fenêtre
    nonConformityReport: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue(OWNER);
  reportCreate.mockResolvedValue({ id: "report-1" });
});

describe("reportNonConformityAction — IDOR", () => {
  it("refuse de signaler la réservation d'un autre utilisateur", async () => {
    requireUserMock.mockResolvedValue(ATTACKER);
    bookingFindUnique.mockResolvedValue(booking());

    const result = await reportNonConformityAction(undefined, reportForm());

    expect(result).toEqual({ error: "Erreur inconnue." });
    expect(reportCreate).not.toHaveBeenCalled();
  });
});

describe("reportNonConformityAction — fenêtre 24h", () => {
  it("refuse avant le check-in", async () => {
    bookingFindUnique.mockResolvedValue(booking({ checkIn: new Date(Date.now() + HOUR) }));

    const result = await reportNonConformityAction(undefined, reportForm());

    expect(result).toEqual({
      error: "Ce signalement n'est disponible que dans les 24 h suivant votre arrivée.",
    });
    expect(reportCreate).not.toHaveBeenCalled();
  });

  it("refuse au-delà de 24h après le check-in", async () => {
    bookingFindUnique.mockResolvedValue(booking({ checkIn: new Date(Date.now() - 25 * HOUR) }));

    const result = await reportNonConformityAction(undefined, reportForm());

    expect(result).toEqual({
      error: "Ce signalement n'est disponible que dans les 24 h suivant votre arrivée.",
    });
    expect(reportCreate).not.toHaveBeenCalled();
  });

  it("accepte pile dans la fenêtre (check-in il y a 2h, statut CONFIRMEE)", async () => {
    bookingFindUnique.mockResolvedValue(booking());

    const result = await reportNonConformityAction(undefined, reportForm());

    expect(result).toEqual({ success: "Signalement envoyé — notre équipe l'examine." });
    expect(reportCreate).toHaveBeenCalledWith({
      data: {
        bookingId: BOOKING_ID,
        category: "ANNONCE_TROMPEUSE",
        description: "Le logement n'a rien à voir avec les photos de l'annonce.",
      },
    });
  });

  it("accepte en statut TERMINEE si toujours dans la fenêtre (check-out déjà passé lazy-completed)", async () => {
    bookingFindUnique.mockResolvedValue(booking({ status: "TERMINEE" }));

    const result = await reportNonConformityAction(undefined, reportForm());

    expect(result).toEqual({ success: "Signalement envoyé — notre équipe l'examine." });
  });

  it("refuse pour une réservation EN_ATTENTE (pas encore confirmée)", async () => {
    bookingFindUnique.mockResolvedValue(booking({ status: "EN_ATTENTE" }));

    const result = await reportNonConformityAction(undefined, reportForm());

    expect(result).toEqual({
      error: "Ce signalement n'est disponible que dans les 24 h suivant votre arrivée.",
    });
    expect(reportCreate).not.toHaveBeenCalled();
  });
});

describe("reportNonConformityAction — unicité (un seul signalement par réservation)", () => {
  it("refuse si un signalement existe déjà (pré-check)", async () => {
    bookingFindUnique.mockResolvedValue(
      booking({ nonConformityReport: { id: "existing-report" } })
    );

    const result = await reportNonConformityAction(undefined, reportForm());

    expect(result).toEqual({ error: "Un signalement a déjà été déposé pour cette réservation." });
    expect(reportCreate).not.toHaveBeenCalled();
  });

  it("refuse proprement sur une violation de contrainte unique concurrente (P2002)", async () => {
    bookingFindUnique.mockResolvedValue(booking());
    reportCreate.mockRejectedValue({ code: "P2002" });

    const result = await reportNonConformityAction(undefined, reportForm());

    expect(result).toEqual({ error: "Un signalement a déjà été déposé pour cette réservation." });
  });
});

describe("reportNonConformityAction — effets de bord du succès", () => {
  it("journalise l'audit, l'événement produit et notifie l'hôte", async () => {
    bookingFindUnique.mockResolvedValue(booking());

    await reportNonConformityAction(undefined, reportForm());

    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "NON_CONFORMITY_REPORTED",
        userId: OWNER.id,
        metadata: { bookingId: BOOKING_ID, category: "ANNONCE_TROMPEUSE" },
      })
    );
    expect(logProductEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "NON_CONFORMITY_REPORTED",
        userId: OWNER.id,
      })
    );
    expect(notifyReportedMock).toHaveBeenCalledWith(BOOKING_ID);
  });
});

describe("reportNonConformityAction — validation zod", () => {
  it("refuse une catégorie hors énumération", async () => {
    bookingFindUnique.mockResolvedValue(booking());

    const result = await reportNonConformityAction(undefined, reportForm({ category: "INVENTEE" }));

    expect(result).toEqual({ error: "Champs requis." });
    expect(bookingFindUnique).not.toHaveBeenCalled();
  });

  it("refuse une description trop courte (< 10 caractères)", async () => {
    const result = await reportNonConformityAction(undefined, reportForm({ description: "court" }));

    expect(result).toEqual({ error: "Champs requis." });
  });
});
