/**
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP7 — non-bypass de l'activation du paiement
 * sur place (Rail 2, §PSP2) sur updatePropertyAction. `cashTermsAcceptedAt` ne
 * doit JAMAIS être posé sans passer par la garde serveur (resolveCashPayment,
 * src/actions/properties.ts) : un hôte ne peut pas activer le toggle sans
 * accepter les CGU (transition false→true), ni forcer une re-acceptation
 * quand le mode est déjà actif (undefined = ne pas toucher au champ existant).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { property: { findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock("@/lib/session", () => ({ requireLister: vi.fn(), requireUser: vi.fn() }));
vi.mock("@/lib/geo", () => ({
  resolveCity: vi.fn(() => "Hammamet"),
  getCity: vi.fn(() => ({ name: "Hammamet", gouvernorat: "Nabeul" })),
}));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/product-events", () => ({ logProductEvent: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { champsRequis: "Champs requis." },
    annonceForm: { cashTermsRequise: "CGU hôte requises." },
  }),
}));

import { updatePropertyAction } from "@/actions/properties";
import { prisma } from "@/lib/prisma";
import { requireLister, requireUser } from "@/lib/session";
import { logProductEvent } from "@/lib/product-events";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const propertyUpdate = prisma.property.update as unknown as Mock;
const requireListerMock = requireLister as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const logProductEventMock = logProductEvent as unknown as Mock;

const OWNER = { id: "host-1", role: "HOTE" };
const PROPERTY_ID = "clproperty000000000000001";

function baseProperty(over: Record<string, unknown> = {}) {
  return {
    id: PROPERTY_ID,
    ownerId: OWNER.id,
    type: "SEJOUR",
    slug: "villa-hammamet-abc123",
    title: "Villa",
    cashPaymentEnabled: false,
    ...over,
  };
}

function updateForm(over: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("propertyId", PROPERTY_ID);
  fd.set("title", "Villa avec piscine et vue mer");
  fd.set("price", "150");
  fd.set("city", "Hammamet");
  fd.set("address", "");
  fd.set("latitude", "36.4");
  fd.set("longitude", "10.6");
  fd.set("description", "Une description suffisamment longue pour passer la validation zod du formulaire.");
  fd.set("maxGuests", "4");
  fd.set("stayKind", "Villa");
  for (const [k, v] of Object.entries(over)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireListerMock.mockResolvedValue(OWNER);
  requireUserMock.mockResolvedValue(OWNER);
  propertyUpdate.mockResolvedValue({});
});

describe("updatePropertyAction — non-bypass de cashTermsAcceptedAt (§PSP7)", () => {
  it("refuse d'activer le paiement sur place sans accepter les CGU hôte (transition false→true)", async () => {
    propertyFindUnique.mockResolvedValue(baseProperty({ cashPaymentEnabled: false }));

    const result = await updatePropertyAction(
      undefined,
      updateForm({ cashPaymentEnabled: "true", cashTermsAccepted: "false" })
    );

    expect(result).toEqual({ error: "CGU hôte requises." });
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("active le paiement sur place et pose cashTermsAcceptedAt SEULEMENT si les CGU sont acceptées (contrôle positif)", async () => {
    propertyFindUnique.mockResolvedValue(baseProperty({ cashPaymentEnabled: false }));

    await updatePropertyAction(
      undefined,
      updateForm({ cashPaymentEnabled: "true", cashTermsAccepted: "true" })
    );

    expect(propertyUpdate).toHaveBeenCalledTimes(1);
    const data = propertyUpdate.mock.calls[0][0].data;
    expect(data.cashPaymentEnabled).toBe(true);
    expect(data.cashTermsAcceptedAt).toBeInstanceOf(Date);
    // §L5.7 — discipline IN4 : le ProductEvent part uniquement sur une VRAIE
    // activation (transition false→true avec CGU acceptées).
    expect(logProductEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: "CASH_PAYMENT_ENABLED", userId: OWNER.id })
    );
  });

  it("ne force PAS une nouvelle acceptation quand le mode est déjà actif (cashTermsAcceptedAt intact, undefined = pas de mutation)", async () => {
    propertyFindUnique.mockResolvedValue(baseProperty({ cashPaymentEnabled: true }));

    const result = await updatePropertyAction(
      undefined,
      updateForm({ cashPaymentEnabled: "true", cashTermsAccepted: "false" })
    );

    expect(result).toBeUndefined(); // succès → redirect (mocké)
    expect(propertyUpdate).toHaveBeenCalledTimes(1);
    const data = propertyUpdate.mock.calls[0][0].data;
    expect(data.cashPaymentEnabled).toBe(true);
    expect(data.cashTermsAcceptedAt).toBeUndefined();
    // Pas de nouvelle activation → pas de nouveau ProductEvent (éviterait de
    // fausser le taux d'adoption avec des resauvegardes).
    expect(logProductEventMock).not.toHaveBeenCalled();
  });

  it("désactive le paiement sur place sans exiger les CGU (false ne nécessite jamais d'acceptation)", async () => {
    propertyFindUnique.mockResolvedValue(baseProperty({ cashPaymentEnabled: true }));

    const result = await updatePropertyAction(
      undefined,
      updateForm({ cashPaymentEnabled: "false", cashTermsAccepted: "false" })
    );

    expect(result).toBeUndefined();
    const data = propertyUpdate.mock.calls[0][0].data;
    expect(data.cashPaymentEnabled).toBe(false);
    expect(data.cashTermsAcceptedAt).toBeUndefined();
    expect(logProductEventMock).not.toHaveBeenCalled();
  });
});
