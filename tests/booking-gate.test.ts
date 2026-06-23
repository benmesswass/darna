/**
 * Tests — gate de confiance sur la réservation.
 * Un compte non vérifié (e-mail OU téléphone manquant) ne peut pas réserver :
 * le serveur refuse AVANT toute écriture (jamais confiance au client).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { property: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/config", () => ({ SERVICE_FEE_RATE: 0.05, SITE_URL: "http://localhost:3000" }));
vi.mock("@/lib/konnect", () => ({ initKonnectPayment: vi.fn(), isKonnectEnabled: vi.fn(() => false) }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    booking: {
      verifRequise: "Vérifiez votre compte avant de réserver.",
      datesInvalides: "Dates invalides.",
    },
  }),
}));

import { createBookingAction } from "@/actions/bookings";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createBookingAction — gate de vérification", () => {
  it("refuse un compte sans e-mail vérifié, AVANT toute lecture en base", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({
      id: "u1",
      emailVerified: false,
      phoneVerified: true,
    });

    const res = await createBookingAction(undefined, fd({ slug: "x", arrivee: "2030-01-01", depart: "2030-01-05", voyageurs: "2" }));

    expect(res).toEqual({ error: "Vérifiez votre compte avant de réserver." });
    expect(prisma.property.findUnique).not.toHaveBeenCalled();
  });

  it("refuse un compte sans téléphone vérifié", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({
      id: "u1",
      emailVerified: true,
      phoneVerified: false,
    });

    const res = await createBookingAction(undefined, fd({ slug: "x", arrivee: "2030-01-01", depart: "2030-01-05", voyageurs: "2" }));

    expect(res).toEqual({ error: "Vérifiez votre compte avant de réserver." });
    expect(prisma.property.findUnique).not.toHaveBeenCalled();
  });

  it("laisse passer le gate quand le compte est vérifié (échoue plus loin, pas sur la vérif)", async () => {
    (requireUser as unknown as Mock).mockResolvedValue({
      id: "u1",
      emailVerified: true,
      phoneVerified: true,
    });

    // Dates invalides → on prouve qu'on a dépassé le gate (erreur différente).
    const res = await createBookingAction(undefined, fd({ slug: "x", arrivee: "bad", depart: "bad", voyageurs: "2" }));

    expect(res).toEqual({ error: "Dates invalides." });
  });
});
