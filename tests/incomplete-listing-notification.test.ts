/**
 * GROWTH_ROADMAP.md §G2 — détection paresseuse des annonces restées
 * incomplètes. Même idiome que tests/host-invoice-reminders.test.ts :
 * pas de cron, dédup par contrainte unique partielle (P2002 silencieux).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findMany: vi.fn() },
    notification: { create: vi.fn() },
  },
}));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));
vi.mock("@/lib/notifications", () => ({
  sendHostInvoiceDueSoonEmail: vi.fn(),
  sendHostInvoiceOverdueEmail: vi.fn(),
}));

import { ensureIncompleteListingNotifications } from "@/lib/notification-center";
import { prisma } from "@/lib/prisma";
import { COMPLETENESS_MIN_PHOTOS, COMPLETENESS_MIN_DESCRIPTION_LENGTH } from "@/lib/config";

const findMany = prisma.property.findMany as unknown as Mock;
const notifCreate = prisma.notification.create as unknown as Mock;

const USER_ID = "host-1";
const LONG_DESCRIPTION = "x".repeat(COMPLETENESS_MIN_DESCRIPTION_LENGTH);
const SHORT_DESCRIPTION = "x".repeat(10);

function propertyRow(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    title: "Villa Hammamet",
    description: SHORT_DESCRIPTION,
    amenities: "",
    _count: { photos: 1 },
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  notifCreate.mockResolvedValue({});
});

describe("ensureIncompleteListingNotifications", () => {
  it("crée une notif ANNONCE_INCOMPLETE pour une annonce sous le seuil de complétude", async () => {
    findMany.mockResolvedValue([propertyRow("p1")]);

    await ensureIncompleteListingNotifications(USER_ID);

    expect(notifCreate).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        type: "ANNONCE_INCOMPLETE",
        propertyTitle: "Villa Hammamet",
        href: "/dashboard/annonces/p1/modifier",
      },
    });
  });

  it("ne fait rien pour une annonce déjà complète (3/3)", async () => {
    findMany.mockResolvedValue([
      propertyRow("p2", {
        description: LONG_DESCRIPTION,
        amenities: "wifi|piscine|climatisation",
        _count: { photos: COMPLETENESS_MIN_PHOTOS },
      }),
    ]);

    await ensureIncompleteListingNotifications(USER_ID);

    expect(notifCreate).not.toHaveBeenCalled();
  });

  it("dédup silencieuse (P2002) : ne relance jamais deux fois la même annonce", async () => {
    findMany.mockResolvedValue([propertyRow("p3")]);
    notifCreate.mockRejectedValue({ code: "P2002" });

    await expect(ensureIncompleteListingNotifications(USER_ID)).resolves.toBeUndefined();
  });

  it("ne cible que les annonces EN_ATTENTE_VALIDATION ou ACTIVE (filtre côté requête)", async () => {
    findMany.mockResolvedValue([]);

    await ensureIncompleteListingNotifications(USER_ID);

    const args = findMany.mock.calls[0][0];
    expect(args.where.status).toEqual({ in: ["EN_ATTENTE_VALIDATION", "ACTIVE"] });
    expect(args.where.ownerId).toBe(USER_ID);
  });

  it("ne relance qu'après le délai de grâce (filtre createdAt côté requête)", async () => {
    findMany.mockResolvedValue([]);

    await ensureIncompleteListingNotifications(USER_ID);

    const args = findMany.mock.calls[0][0];
    expect(args.where.createdAt.lte).toBeInstanceOf(Date);
    expect(args.where.createdAt.lte.getTime()).toBeLessThan(Date.now());
  });
});
