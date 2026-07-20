/**
 * MONETISATION_IMMO_ROADMAP.md §MI4 — IDOR, non-bypass de rôle/palier/cycle,
 * et idempotence sur le boost « à la une » offert par abonnement (palier Pro,
 * 1/mois, non cumulable — décision Wassim du 2026-07-20). Miroir de
 * tests/featured-payment-idor.test.ts et tests/property-idor.test.ts,
 * appliqué au rail gratuit (claimFreeFeaturedBoostAction) plutôt qu'au rail
 * payant Konnect.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn(), update: vi.fn() },
    subscription: { findUnique: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn(), requireLister: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { claimFreeFeaturedBoostAction } from "@/actions/properties";
import { prisma } from "@/lib/prisma";
import { requireUser, requireLister } from "@/lib/session";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const propertyUpdate = prisma.property.update as unknown as Mock;
const subFindUnique = prisma.subscription.findUnique as unknown as Mock;
const subUpdateMany = prisma.subscription.updateMany as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const requireListerMock = requireLister as unknown as Mock;
const redirectMock = redirect as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;

const AGENCE = { id: "agence-A", role: "AGENCE" };
const OTHER_AGENCE = { id: "agence-B", role: "AGENCE" };
const HOTE = { id: "hote-C", role: "HOTE" };
const PROP_ID = "clproperty000000000000001";

function idForm(): FormData {
  const fd = new FormData();
  fd.set("propertyId", PROP_ID);
  return fd;
}

function activeProperty(ownerId: string, over: Record<string, unknown> = {}) {
  return {
    id: PROP_ID,
    ownerId,
    slug: "villa-hammamet",
    type: "SEJOUR",
    title: "Villa Hammamet",
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    featuredUntil: null,
    cashPaymentEnabled: false,
    ...over,
  };
}

function proSubscription(over: Record<string, unknown> = {}) {
  return {
    status: "ACTIF",
    plan: "PRO",
    currentPeriodEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    freeBoostUsedAt: null,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  propertyUpdate.mockResolvedValue({});
  subUpdateMany.mockResolvedValue({ count: 1 });
});

describe("claimFreeFeaturedBoostAction — IDOR", () => {
  it("lève ACCES_REFUSE quand une autre agence tente de réclamer le boost", async () => {
    requireListerMock.mockResolvedValue(OTHER_AGENCE);
    requireUserMock.mockResolvedValue(OTHER_AGENCE);
    propertyFindUnique.mockResolvedValue(activeProperty(AGENCE.id));

    await expect(claimFreeFeaturedBoostAction(idForm())).rejects.toThrow("ACCES_REFUSE");
    expect(subUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });
});

describe("claimFreeFeaturedBoostAction — non-bypass rôle/palier/cycle", () => {
  it("ne fait rien pour un compte HOTE (le mécanisme ne cible que les agences)", async () => {
    requireListerMock.mockResolvedValue(HOTE);

    await claimFreeFeaturedBoostAction(idForm());

    expect(requireUserMock).not.toHaveBeenCalled();
    expect(subFindUnique).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("ne fait rien sans abonnement (aucune Subscription)", async () => {
    requireListerMock.mockResolvedValue(AGENCE);
    requireUserMock.mockResolvedValue(AGENCE);
    propertyFindUnique.mockResolvedValue(activeProperty(AGENCE.id));
    subFindUnique.mockResolvedValue(null);

    await claimFreeFeaturedBoostAction(idForm());

    expect(subUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("ne fait rien pour un palier sans boost offert (Standard)", async () => {
    requireListerMock.mockResolvedValue(AGENCE);
    requireUserMock.mockResolvedValue(AGENCE);
    propertyFindUnique.mockResolvedValue(activeProperty(AGENCE.id));
    subFindUnique.mockResolvedValue(proSubscription({ plan: "STANDARD" }));

    await claimFreeFeaturedBoostAction(idForm());

    expect(subUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("ne fait rien si le boost du cycle est déjà consommé (non cumulable)", async () => {
    requireListerMock.mockResolvedValue(AGENCE);
    requireUserMock.mockResolvedValue(AGENCE);
    propertyFindUnique.mockResolvedValue(activeProperty(AGENCE.id));
    subFindUnique.mockResolvedValue(proSubscription({ freeBoostUsedAt: new Date() }));

    await claimFreeFeaturedBoostAction(idForm());

    expect(subUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("ne fait rien pour un abonnement expiré (EXPIRE dérivé)", async () => {
    requireListerMock.mockResolvedValue(AGENCE);
    requireUserMock.mockResolvedValue(AGENCE);
    propertyFindUnique.mockResolvedValue(activeProperty(AGENCE.id));
    subFindUnique.mockResolvedValue(
      proSubscription({ currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000) })
    );

    await claimFreeFeaturedBoostAction(idForm());

    expect(subUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("ne fait rien sur une annonce non active / expirée", async () => {
    requireListerMock.mockResolvedValue(AGENCE);
    requireUserMock.mockResolvedValue(AGENCE);
    propertyFindUnique.mockResolvedValue(activeProperty(AGENCE.id, { status: "EXPIREE" }));
    subFindUnique.mockResolvedValue(proSubscription());

    await claimFreeFeaturedBoostAction(idForm());

    expect(subUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });
});

describe("claimFreeFeaturedBoostAction — course concurrente (double clic)", () => {
  it("n'applique pas le boost si une requête concurrente a déjà consommé le cycle", async () => {
    requireListerMock.mockResolvedValue(AGENCE);
    requireUserMock.mockResolvedValue(AGENCE);
    propertyFindUnique.mockResolvedValue(activeProperty(AGENCE.id));
    subFindUnique.mockResolvedValue(proSubscription());
    subUpdateMany.mockResolvedValue({ count: 0 }); // perdant de la course

    await claimFreeFeaturedBoostAction(idForm());

    expect(propertyUpdate).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("claimFreeFeaturedBoostAction — cas nominal", () => {
  it("consomme le boost et prolonge featuredUntil pour une agence Pro éligible", async () => {
    requireListerMock.mockResolvedValue(AGENCE);
    requireUserMock.mockResolvedValue(AGENCE);
    propertyFindUnique.mockResolvedValue(activeProperty(AGENCE.id));
    subFindUnique.mockResolvedValue(proSubscription());

    await claimFreeFeaturedBoostAction(idForm());

    expect(subUpdateMany).toHaveBeenCalledWith({
      where: { userId: AGENCE.id, freeBoostUsedAt: null },
      data: { freeBoostUsedAt: expect.any(Date) },
    });
    expect(propertyUpdate).toHaveBeenCalledWith({
      where: { id: PROP_ID },
      data: { featuredUntil: expect.any(Date) },
    });
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PROPERTY_FEATURED",
        userId: AGENCE.id,
        metadata: expect.objectContaining({ provider: "subscription_perk" }),
      })
    );
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/annonces?alaune=1");
  });
});
