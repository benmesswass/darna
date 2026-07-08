/**
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP6 — levier de recouvrement. Un hôte avec
 * une HostInvoice EN_ATTENTE en retard ne peut recevoir aucune NOUVELLE
 * réservation (même patron que booking-gate.test.ts : on prouve juste que le
 * guard coupe AVANT la transaction, pas le comportement complet du flux).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { property: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ sendBookingConfirmationEmail: vi.fn() }));
vi.mock("@/lib/config", () => ({ SERVICE_FEE_RATE: 0.05, SITE_URL: "http://localhost:3000" }));
vi.mock("@/lib/konnect", () => ({ initKonnectPayment: vi.fn(), isKonnectEnabled: vi.fn(() => false) }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/host-invoicing", () => ({ hasOverdueHostInvoice: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    booking: {
      hoteFactureImpayee: "Logement indisponible (facture hôte en retard).",
      proprietaireImpossible: "Vous ne pouvez pas réserver votre propre logement.",
    },
  }),
}));

import { createBookingAction } from "@/actions/bookings";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasOverdueHostInvoice } from "@/lib/host-invoicing";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

function validProperty(over: Record<string, unknown> = {}) {
  return {
    id: "prop_1",
    type: "SEJOUR",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    price: 100,
    stay: { maxGuests: 4 },
    ownerId: "host_1",
    cashPaymentEnabled: false,
    cancelBlockedUntil: null,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  (requireUser as unknown as Mock).mockResolvedValue({
    id: "guest_1",
    emailVerified: true,
    phoneVerified: true,
    suspended: false,
    kycStatus: "NON_VERIFIE",
  });
});

describe("createBookingAction — levier de recouvrement (§PSP6)", () => {
  it("refuse toute nouvelle réservation quand l'hôte a une facture en retard", async () => {
    (prisma.property.findUnique as unknown as Mock).mockResolvedValue(validProperty());
    (hasOverdueHostInvoice as unknown as Mock).mockResolvedValue(true);

    const res = await createBookingAction(
      undefined,
      fd({ slug: "villa", arrivee: "2030-01-01", depart: "2030-01-05", voyageurs: "2" })
    );

    expect(res).toEqual({ error: "Logement indisponible (facture hôte en retard)." });
    expect(hasOverdueHostInvoice).toHaveBeenCalledWith("host_1");
  });

  it("laisse passer le guard dès que l'hôte n'a plus de facture en retard (réglée) — sans rien resynchroniser", async () => {
    (prisma.property.findUnique as unknown as Mock).mockResolvedValue(validProperty());
    (hasOverdueHostInvoice as unknown as Mock).mockResolvedValue(false);

    // La transaction Prisma n'est pas mockée ici (hors scope de ce test) :
    // on dépasse volontairement le guard PSP6 et on prouve juste qu'on est
    // allé PLUS LOIN (l'échec suivant vient de $transaction manquant, pas
    // du guard facture) — sans rien à resynchroniser une fois la facture
    // réglée, contrairement à un statut dénormalisé qu'il faudrait recalculer.
    await expect(
      createBookingAction(
        undefined,
        fd({ slug: "villa", arrivee: "2030-01-01", depart: "2030-01-05", voyageurs: "2" })
      )
    ).rejects.toThrow();
    expect(hasOverdueHostInvoice).toHaveBeenCalledWith("host_1");
  });
});
