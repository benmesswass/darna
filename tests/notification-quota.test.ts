/**
 * MONETISATION_IMMO_ROADMAP.md §MI2 — notification à l'AGENCE quand une
 * annonce ne peut pas être activée faute de quota (verifyPropertyAction n'a
 * aucun autre moyen de le lui faire savoir). Miroir de
 * tests/host-cancel-notification.test.ts.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { notification: { create: vi.fn() } },
}));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));
vi.mock("@/lib/notifications", () => ({
  sendHostInvoiceDueSoonEmail: vi.fn(),
  sendHostInvoiceOverdueEmail: vi.fn(),
}));

import { notifyAgencyQuotaReached } from "@/lib/notification-center";
import { notificationMessage } from "@/lib/notification-text";
import { prisma } from "@/lib/prisma";
import { fr } from "@/lib/i18n/fr";
import { en } from "@/lib/i18n/en";
import { ar } from "@/lib/i18n/ar";

const notifCreate = prisma.notification.create as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  notifCreate.mockResolvedValue({});
});

describe("notifyAgencyQuotaReached", () => {
  it("crée une notification pointant vers /dashboard/abonnement avec le titre de l'annonce bloquée", async () => {
    await notifyAgencyQuotaReached("agence-1", "Appartement S+2 vue mer");

    expect(notifCreate).toHaveBeenCalledWith({
      data: {
        userId: "agence-1",
        type: "ANNONCE_LIMITE_ABONNEMENT",
        propertyTitle: "Appartement S+2 vue mer",
        href: "/dashboard/abonnement",
      },
    });
  });
});

describe("notificationMessage — libellé « limite d'abonnement » dans les 3 locales", () => {
  it.each([
    ["fr", fr],
    ["en", en],
    ["ar", ar],
  ])("%s : libellé non vide contenant le titre de l'annonce", (_locale, dict) => {
    const msg = notificationMessage(dict, {
      type: "ANNONCE_LIMITE_ABONNEMENT",
      propertyTitle: "Appartement S+2 vue mer",
    });
    expect(msg).not.toBe("");
    expect(msg).toContain("Appartement S+2 vue mer");
  });
});
