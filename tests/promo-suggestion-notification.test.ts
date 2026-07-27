/**
 * CROISSANCE_ROADMAP.md §PM2 — nudge promo pour annonces à nuits vides à
 * court terme. Même idiome que tests/incomplete-listing-notification.test.ts :
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

import { ensurePromoSuggestionNotifications } from "@/lib/notification-center";
import { prisma } from "@/lib/prisma";

const findMany = prisma.property.findMany as unknown as Mock;
const notifCreate = prisma.notification.create as unknown as Mock;

const USER_ID = "host-1";

function monthBucket(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

beforeEach(() => {
  vi.clearAllMocks();
  notifCreate.mockResolvedValue({});
});

describe("ensurePromoSuggestionNotifications", () => {
  it("crée une notif ANNONCE_PROMO_SUGGEREE pour une annonce sans résa proche, href bucketé par mois", async () => {
    findMany.mockResolvedValue([{ id: "p1", title: "Villa Hammamet" }]);

    await ensurePromoSuggestionNotifications(USER_ID);

    expect(notifCreate).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        type: "ANNONCE_PROMO_SUGGEREE",
        propertyTitle: "Villa Hammamet",
        href: `/dashboard/annonces/p1/modifier?promo=${monthBucket(new Date())}`,
      },
    });
  });

  it("ne fait rien quand aucune annonce ne correspond (filtre entièrement côté requête)", async () => {
    findMany.mockResolvedValue([]);

    await ensurePromoSuggestionNotifications(USER_ID);

    expect(notifCreate).not.toHaveBeenCalled();
  });

  it("dédup silencieuse (P2002) : ne relance jamais deux fois la même annonce le même mois", async () => {
    findMany.mockResolvedValue([{ id: "p3", title: "Riad Sousse" }]);
    notifCreate.mockRejectedValue({ code: "P2002" });

    await expect(ensurePromoSuggestionNotifications(USER_ID)).resolves.toBeUndefined();
  });

  it("ne cible que les annonces ACTIVE, vérifiées depuis le seuil (filtre côté requête)", async () => {
    findMany.mockResolvedValue([]);

    await ensurePromoSuggestionNotifications(USER_ID);

    const args = findMany.mock.calls[0][0];
    expect(args.where.ownerId).toBe(USER_ID);
    expect(args.where.status).toBe("ACTIVE");
    expect(args.where.verified).toBe(true);
    expect(args.where.verifiedAt.lte).toBeInstanceOf(Date);
    expect(args.where.verifiedAt.lte.getTime()).toBeLessThan(Date.now());
  });

  it("exclut toute annonce avec une résa CONFIRMEE chevauchant la fenêtre à venir (filtre côté requête)", async () => {
    findMany.mockResolvedValue([]);

    await ensurePromoSuggestionNotifications(USER_ID);

    const args = findMany.mock.calls[0][0];
    const noneClause = args.where.bookings.none;
    expect(noneClause.status).toBe("CONFIRMEE");
    expect(noneClause.checkIn.lt).toBeInstanceOf(Date);
    expect(noneClause.checkOut.gt).toBeInstanceOf(Date);
    expect(noneClause.checkIn.lt.getTime()).toBeGreaterThan(Date.now());
  });
});
