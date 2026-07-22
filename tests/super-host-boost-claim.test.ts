/**
 * GROWTH_ROADMAP.md §G4 — IDOR, non-bypass mérite/fenêtre, et idempotence sur
 * le boost « à la une » offert au mérite (badge Super-Hôte, ouvert HOTE et
 * AGENCE). Miroir de tests/free-boost-claim.test.ts (MI4), appliqué à
 * claimSuperHostBoostAction plutôt qu'au rail d'abonnement.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn(), updateMany: vi.fn() },
    review: { findMany: vi.fn() },
    booking: { count: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: vi.fn(), requireLister: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { claimSuperHostBoostAction } from "@/actions/properties";
import { prisma } from "@/lib/prisma";
import { requireUser, requireLister } from "@/lib/session";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";

const propertyFindUnique = prisma.property.findUnique as unknown as Mock;
const propertyUpdate = prisma.property.update as unknown as Mock;
const userFindUnique = prisma.user.findUnique as unknown as Mock;
const userUpdateMany = prisma.user.updateMany as unknown as Mock;
const reviewFindMany = prisma.review.findMany as unknown as Mock;
const bookingCount = prisma.booking.count as unknown as Mock;
const requireUserMock = requireUser as unknown as Mock;
const requireListerMock = requireLister as unknown as Mock;
const redirectMock = redirect as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;

const HOTE = { id: "hote-A", role: "HOTE" };
const OTHER_HOTE = { id: "hote-B", role: "HOTE" };
const AGENCE = { id: "agence-C", role: "AGENCE" };
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

const EXCELLENT_REVIEWS = [{ rating: 5 }, { rating: 5 }, { rating: 5 }];

beforeEach(() => {
  vi.clearAllMocks();
  propertyUpdate.mockResolvedValue({});
  userUpdateMany.mockResolvedValue({ count: 1 });
  reviewFindMany.mockResolvedValue(EXCELLENT_REVIEWS);
  bookingCount.mockResolvedValue(0);
});

describe("claimSuperHostBoostAction — IDOR", () => {
  it("lève ACCES_REFUSE quand un autre hôte tente de réclamer le boost", async () => {
    requireListerMock.mockResolvedValue(OTHER_HOTE);
    requireUserMock.mockResolvedValue(OTHER_HOTE);
    propertyFindUnique.mockResolvedValue(activeProperty(HOTE.id));

    await expect(claimSuperHostBoostAction(idForm())).rejects.toThrow("ACCES_REFUSE");
    expect(userUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });
});

describe("claimSuperHostBoostAction — ouvert à HOTE et AGENCE", () => {
  it("fonctionne pour un compte AGENCE aussi (contrairement au rail d'abonnement MI4)", async () => {
    requireListerMock.mockResolvedValue(AGENCE);
    requireUserMock.mockResolvedValue(AGENCE);
    propertyFindUnique.mockResolvedValue(activeProperty(AGENCE.id));
    userFindUnique.mockResolvedValue({ superHostBoostClaimedAt: null });

    await claimSuperHostBoostAction(idForm());

    expect(propertyUpdate).toHaveBeenCalled();
  });
});

describe("claimSuperHostBoostAction — non-bypass mérite/fenêtre", () => {
  it("ne fait rien si le badge Super-Hôte n'est pas actif (pas assez d'avis)", async () => {
    requireListerMock.mockResolvedValue(HOTE);
    requireUserMock.mockResolvedValue(HOTE);
    propertyFindUnique.mockResolvedValue(activeProperty(HOTE.id));
    userFindUnique.mockResolvedValue({ superHostBoostClaimedAt: null });
    reviewFindMany.mockResolvedValue([{ rating: 5 }]); // 1 < SUPER_HOST_MIN_REVIEWS

    await claimSuperHostBoostAction(idForm());

    expect(userUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("ne fait rien si une annulation hôte récente casse le critère de mérite", async () => {
    requireListerMock.mockResolvedValue(HOTE);
    requireUserMock.mockResolvedValue(HOTE);
    propertyFindUnique.mockResolvedValue(activeProperty(HOTE.id));
    userFindUnique.mockResolvedValue({ superHostBoostClaimedAt: null });
    bookingCount.mockResolvedValue(1); // fait chuter la moyenne blended sous 4.5

    await claimSuperHostBoostAction(idForm());

    expect(userUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("ne fait rien pour un compte suspendu", async () => {
    requireListerMock.mockResolvedValue(HOTE);
    requireUserMock.mockResolvedValue(HOTE);
    propertyFindUnique.mockResolvedValue(activeProperty(HOTE.id));
    // Premier findUnique (super-host-boost-claim.ts) : superHostBoostClaimedAt.
    // Deuxième findUnique (isSuperHost → super-host.ts) : suspended.
    userFindUnique
      .mockResolvedValueOnce({ superHostBoostClaimedAt: null })
      .mockResolvedValueOnce({ suspended: true });

    await claimSuperHostBoostAction(idForm());

    expect(userUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("ne fait rien si déjà réclamé récemment (fenêtre non écoulée)", async () => {
    requireListerMock.mockResolvedValue(HOTE);
    requireUserMock.mockResolvedValue(HOTE);
    propertyFindUnique.mockResolvedValue(activeProperty(HOTE.id));
    userFindUnique.mockResolvedValue({
      superHostBoostClaimedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    await claimSuperHostBoostAction(idForm());

    expect(reviewFindMany).not.toHaveBeenCalled();
    expect(userUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("ne fait rien sur une annonce non active / expirée", async () => {
    requireListerMock.mockResolvedValue(HOTE);
    requireUserMock.mockResolvedValue(HOTE);
    propertyFindUnique.mockResolvedValue(activeProperty(HOTE.id, { status: "EN_ATTENTE_VALIDATION" }));
    userFindUnique.mockResolvedValue({ superHostBoostClaimedAt: null });

    await claimSuperHostBoostAction(idForm());

    expect(userUpdateMany).not.toHaveBeenCalled();
    expect(propertyUpdate).not.toHaveBeenCalled();
  });
});

describe("claimSuperHostBoostAction — course concurrente (double clic)", () => {
  it("n'applique pas le boost si une requête concurrente a déjà consommé la fenêtre", async () => {
    requireListerMock.mockResolvedValue(HOTE);
    requireUserMock.mockResolvedValue(HOTE);
    propertyFindUnique.mockResolvedValue(activeProperty(HOTE.id));
    userFindUnique.mockResolvedValue({ superHostBoostClaimedAt: null });
    userUpdateMany.mockResolvedValue({ count: 0 }); // perdant de la course

    await claimSuperHostBoostAction(idForm());

    expect(propertyUpdate).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("claimSuperHostBoostAction — cas nominal", () => {
  it("consomme la fenêtre et prolonge featuredUntil pour un hôte Super-Hôte éligible", async () => {
    requireListerMock.mockResolvedValue(HOTE);
    requireUserMock.mockResolvedValue(HOTE);
    propertyFindUnique.mockResolvedValue(activeProperty(HOTE.id));
    userFindUnique.mockResolvedValue({ superHostBoostClaimedAt: null });

    await claimSuperHostBoostAction(idForm());

    expect(userUpdateMany).toHaveBeenCalledWith({
      where: {
        id: HOTE.id,
        OR: [{ superHostBoostClaimedAt: null }, { superHostBoostClaimedAt: { lt: expect.any(Date) } }],
      },
      data: { superHostBoostClaimedAt: expect.any(Date) },
    });
    expect(propertyUpdate).toHaveBeenCalledWith({
      where: { id: PROP_ID },
      data: { featuredUntil: expect.any(Date) },
    });
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PROPERTY_FEATURED",
        userId: HOTE.id,
        metadata: expect.objectContaining({ provider: "super_host_perk" }),
      })
    );
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/annonces?alaune=1");
  });

  it("cumule avec featuredUntil restant si l'annonce est déjà à la une", async () => {
    requireListerMock.mockResolvedValue(HOTE);
    requireUserMock.mockResolvedValue(HOTE);
    const futureFeaturedUntil = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    propertyFindUnique.mockResolvedValue(
      activeProperty(HOTE.id, { featuredUntil: futureFeaturedUntil })
    );
    userFindUnique.mockResolvedValue({ superHostBoostClaimedAt: null });

    await claimSuperHostBoostAction(idForm());

    const call = propertyUpdate.mock.calls[0][0];
    expect(call.data.featuredUntil.getTime()).toBeGreaterThan(futureFeaturedUntil.getTime());
  });
});
