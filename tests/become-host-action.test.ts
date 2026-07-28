/**
 * Tests — becomeHostAction (LANCEMENT_ROADMAP.md §L8.1).
 * Invariants : réservé aux VOYAGEUR (pas de rétrogradation/changement latéral
 * HOTE↔AGENCE↔ADMIN), rate-limité, redirige vers callbackUrl (ou le fallback)
 * après la bascule, mesure ROLE_UPGRADED (ProductEvent).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: vi.fn() } },
}));

vi.mock("@/lib/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("@/lib/product-events", () => ({ logProductEvent: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/lib/uploads", () => ({ saveUploadedImage: vi.fn(), deleteUploadedImage: vi.fn() }));
vi.mock("@/lib/redirect", () => ({
  safeCallbackUrl: vi.fn((raw: string, fallback: string) => (raw ? raw : fallback)),
}));

vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    common: { champsRequis: "Champs requis.", tropDeTentatives: "Trop.", erreurInconnue: "Err." },
  }),
}));

import { becomeHostAction } from "@/actions/profile";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { logProductEvent } from "@/lib/product-events";
import { redirect } from "next/navigation";
import { assertRateLimit } from "@/lib/rate-limit";

const mockRequireUser = requireUser as unknown as Mock;
const mockUpdate = prisma.user.update as unknown as Mock;
const mockLogAudit = logAudit as unknown as Mock;
const mockLogProductEvent = logProductEvent as unknown as Mock;
const mockRedirect = redirect as unknown as Mock;
const mockAssertRateLimit = assertRateLimit as unknown as Mock;

function makeFd(role: string, callbackUrl?: string): FormData {
  const fd = new FormData();
  fd.set("role", role);
  if (callbackUrl) fd.set("callbackUrl", callbackUrl);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertRateLimit.mockResolvedValue(true);
  mockRequireUser.mockResolvedValue({ id: "u1", role: "VOYAGEUR" });
  mockUpdate.mockResolvedValue({});
});

describe("becomeHostAction", () => {
  it("rejette si le rate limit est dépassé", async () => {
    mockAssertRateLimit.mockResolvedValueOnce(false);

    const res = await becomeHostAction(undefined, makeFd("HOTE"));

    expect(res?.error).toBe("Trop.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejette un compte déjà HOTE (pas de changement latéral)", async () => {
    mockRequireUser.mockResolvedValueOnce({ id: "u1", role: "HOTE" });

    const res = await becomeHostAction(undefined, makeFd("AGENCE"));

    expect(res?.error).toBe("Err.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejette un compte déjà AGENCE", async () => {
    mockRequireUser.mockResolvedValueOnce({ id: "u1", role: "AGENCE" });

    const res = await becomeHostAction(undefined, makeFd("HOTE"));

    expect(res?.error).toBe("Err.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejette un compte ADMIN", async () => {
    mockRequireUser.mockResolvedValueOnce({ id: "u1", role: "ADMIN" });

    const res = await becomeHostAction(undefined, makeFd("HOTE"));

    expect(res?.error).toBe("Err.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejette un rôle cible invalide", async () => {
    const res = await becomeHostAction(undefined, makeFd("VOYAGEUR"));

    expect(res?.error).toBe("Champs requis.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("bascule VOYAGEUR→HOTE, journalise, mesure et redirige vers le fallback sans callbackUrl", async () => {
    await becomeHostAction(undefined, makeFd("HOTE"));

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { role: "HOTE" },
    });
    expect(mockLogAudit).toHaveBeenCalledWith({
      action: "PROFILE_UPDATED",
      userId: "u1",
      success: true,
      metadata: { roleUpgraded: "HOTE" },
    });
    expect(mockLogProductEvent).toHaveBeenCalledWith({
      event: "ROLE_UPGRADED",
      userId: "u1",
      metadata: { role: "HOTE" },
    });
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/annonces");
  });

  it("bascule VOYAGEUR→AGENCE", async () => {
    await becomeHostAction(undefined, makeFd("AGENCE"));

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { role: "AGENCE" },
    });
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/annonces");
  });

  it("redirige vers callbackUrl quand fourni", async () => {
    await becomeHostAction(undefined, makeFd("HOTE", "/dashboard/annonces/nouvelle?ville=Hammamet"));

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/annonces/nouvelle?ville=Hammamet");
  });
});
