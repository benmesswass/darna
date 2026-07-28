/**
 * LANCEMENT_ROADMAP.md §L7.2 — chaque entité est purgée sur son propre seuil
 * de rétention (`src/lib/config.ts`), isolément (une erreur sur l'une ne doit
 * pas empêcher les autres), même patron que reconcileKonnectPayments.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    productEvent: { deleteMany: vi.fn() },
    propertyView: { deleteMany: vi.fn() },
    auditLog: { deleteMany: vi.fn() },
    passwordResetToken: { deleteMany: vi.fn() },
    otpChallenge: { deleteMany: vi.fn() },
  },
}));
vi.mock("@/lib/observability", () => ({ captureError: vi.fn() }));

import { purgeRetention } from "@/lib/jobs/retention-purge";
import { prisma } from "@/lib/prisma";
import { captureError } from "@/lib/observability";

const productEventDeleteMany = prisma.productEvent.deleteMany as unknown as Mock;
const propertyViewDeleteMany = prisma.propertyView.deleteMany as unknown as Mock;
const auditLogDeleteMany = prisma.auditLog.deleteMany as unknown as Mock;
const passwordResetTokenDeleteMany = prisma.passwordResetToken.deleteMany as unknown as Mock;
const otpChallengeDeleteMany = prisma.otpChallenge.deleteMany as unknown as Mock;
const captureErrorMock = captureError as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  productEventDeleteMany.mockResolvedValue({ count: 0 });
  propertyViewDeleteMany.mockResolvedValue({ count: 0 });
  auditLogDeleteMany.mockResolvedValue({ count: 0 });
  passwordResetTokenDeleteMany.mockResolvedValue({ count: 0 });
  otpChallengeDeleteMany.mockResolvedValue({ count: 0 });
});

describe("purgeRetention", () => {
  it("purge chaque entité sur son propre seuil createdAt/expiresAt et remonte les comptes", async () => {
    productEventDeleteMany.mockResolvedValue({ count: 12 });
    propertyViewDeleteMany.mockResolvedValue({ count: 3 });
    auditLogDeleteMany.mockResolvedValue({ count: 5 });
    passwordResetTokenDeleteMany.mockResolvedValue({ count: 1 });
    otpChallengeDeleteMany.mockResolvedValue({ count: 2 });

    const summary = await purgeRetention();

    expect(summary).toEqual({
      ProductEvent: 12,
      PropertyView: 3,
      AuditLog: 5,
      PasswordResetToken: 1,
      OtpChallenge: 2,
    });
  });

  it("ProductEvent/PropertyView/AuditLog filtrent sur createdAt < seuil", async () => {
    await purgeRetention();

    expect(productEventDeleteMany.mock.calls[0][0].where.createdAt.lt).toBeInstanceOf(Date);
    expect(propertyViewDeleteMany.mock.calls[0][0].where.createdAt.lt).toBeInstanceOf(Date);
    expect(auditLogDeleteMany.mock.calls[0][0].where.createdAt.lt).toBeInstanceOf(Date);
  });

  it("PasswordResetToken/OtpChallenge filtrent sur expiresAt < maintenant (aucune fenêtre de grâce)", async () => {
    await purgeRetention();

    expect(passwordResetTokenDeleteMany.mock.calls[0][0].where.expiresAt.lt).toBeInstanceOf(Date);
    expect(otpChallengeDeleteMany.mock.calls[0][0].where.expiresAt.lt).toBeInstanceOf(Date);
  });

  it("AuditLog a le seuil le plus court (13 mois) : strictement inférieur à celui de ProductEvent (25 mois)", async () => {
    await purgeRetention();

    const auditThreshold = auditLogDeleteMany.mock.calls[0][0].where.createdAt.lt as Date;
    const productEventThreshold = productEventDeleteMany.mock.calls[0][0].where.createdAt.lt as Date;
    // Seuil "plus ancien que" : AuditLog doit être une date PLUS RÉCENTE
    // (fenêtre de rétention plus courte) que celle de ProductEvent.
    expect(auditThreshold.getTime()).toBeGreaterThan(productEventThreshold.getTime());
  });

  it("isole une entité en échec : les autres sont quand même purgées", async () => {
    productEventDeleteMany.mockRejectedValue(new Error("boom"));
    propertyViewDeleteMany.mockResolvedValue({ count: 7 });

    const summary = await purgeRetention();

    expect(captureErrorMock).toHaveBeenCalledTimes(1);
    expect(captureErrorMock).toHaveBeenCalledWith(expect.any(Error), {
      entity: "ProductEvent",
      phase: "retention-purge",
    });
    expect(summary.ProductEvent).toBe(0);
    expect(summary.PropertyView).toBe(7);
  });
});
