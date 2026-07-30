/**
 * P3.5 (ROADMAP.md) — chaînage de hachage de logAudit() pour les actions
 * financières/identité (CHAINED_ACTIONS, src/lib/audit.ts). audit.ts n'avait
 * jusqu'ici AUCUNE couverture directe (toujours mocké par ses consommateurs).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: { create: vi.fn() },
    auditChainState: { upsert: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/rate-limit", () => ({ clientIp: vi.fn().mockResolvedValue("1.2.3.4") }));

import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const auditLogCreate = prisma.auditLog.create as unknown as Mock;
const chainUpsert = prisma.auditChainState.upsert as unknown as Mock;
const txRun = prisma.$transaction as unknown as Mock;

const HEX64 = /^[0-9a-f]{64}$/;

beforeEach(() => {
  vi.clearAllMocks();
});

/** Simule un pointeur de chaîne réel : upsert lit l'état courant, updateMany
 *  (dans la transaction) l'avance — pour vérifier la vraie propriété de
 *  chaînage (prevHash de N+1 == hash de N), pas une valeur câblée en dur. */
function wireRealisticChainState(initial = "genesis") {
  let lastHash = initial;
  chainUpsert.mockImplementation(async () => ({ id: "singleton", lastHash }));
  txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
    cb({
      auditChainState: {
        updateMany: vi.fn(async ({ data }: { data: { lastHash: string } }) => {
          lastHash = data.lastHash;
          return { count: 1 };
        }),
      },
      auditLog: { create: auditLogCreate },
    })
  );
}

describe("logAudit — actions non chaînées", () => {
  it("écrit sans toucher à AuditChainState (comportement inchangé)", async () => {
    await logAudit({ action: "PROFILE_UPDATED", userId: "u1" });

    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    const data = auditLogCreate.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("hash");
    expect(data).not.toHaveProperty("prevHash");
    expect(chainUpsert).not.toHaveBeenCalled();
    expect(txRun).not.toHaveBeenCalled();
  });
});

describe("logAudit — actions chaînées (financier/identité)", () => {
  it("pose hash + prevHash, en partant de genesis pour le tout premier enregistrement", async () => {
    wireRealisticChainState();

    await logAudit({ action: "PAYMENT_CONFIRMED", userId: "u1", metadata: { amount: 10 } });

    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    const data = auditLogCreate.mock.calls[0][0].data;
    expect(data.prevHash).toBe("genesis");
    expect(data.hash).toMatch(HEX64);
  });

  it("chaîne réellement deux écritures successives (prevHash[2] === hash[1])", async () => {
    wireRealisticChainState();

    await logAudit({ action: "PAYMENT_CONFIRMED", userId: "u1" });
    await logAudit({ action: "BOOKING_CREATED", userId: "u1" });

    expect(auditLogCreate).toHaveBeenCalledTimes(2);
    const first = auditLogCreate.mock.calls[0][0].data;
    const second = auditLogCreate.mock.calls[1][0].data;
    expect(second.prevHash).toBe(first.hash);
    expect(second.hash).not.toBe(first.hash);
  });

  it("deux entrées avec des métadonnées différentes produisent des hash différents", async () => {
    wireRealisticChainState();

    await logAudit({ action: "PAYMENT_CONFIRMED", userId: "u1", metadata: { amount: 10 } });
    await logAudit({ action: "PAYMENT_CONFIRMED", userId: "u1", metadata: { amount: 99 } });

    const first = auditLogCreate.mock.calls[0][0].data;
    const second = auditLogCreate.mock.calls[1][0].data;
    // prevHash différent (chaîne avancée) ET hash différent : pas de collision triviale.
    expect(second.hash).not.toBe(first.hash);
  });

  it("retente sur perte de la course (CAS) et chaîne sur l'état relu, pas l'état périmé", async () => {
    let call = 0;
    chainUpsert.mockImplementation(async () => {
      call += 1;
      return { id: "singleton", lastHash: call === 1 ? "genesis" : "advanced-by-someone-else" };
    });
    const updateMany = vi
      .fn()
      .mockResolvedValueOnce({ count: 0 }) // 1re tentative : quelqu'un d'autre a gagné
      .mockResolvedValueOnce({ count: 1 }); // 2e tentative : gagnée
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({ auditChainState: { updateMany }, auditLog: { create: auditLogCreate } })
    );

    await logAudit({ action: "KYC_VERIFIED", userId: "u1" });

    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    expect(auditLogCreate.mock.calls[0][0].data.prevHash).toBe("advanced-by-someone-else");
  });

  it("contention épuisée : écrit quand même (sans hash), ne bloque jamais l'appelant", async () => {
    chainUpsert.mockResolvedValue({ id: "singleton", lastHash: "genesis" });
    const updateMany = vi.fn().mockResolvedValue({ count: 0 }); // jamais gagné
    txRun.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({ auditChainState: { updateMany }, auditLog: { create: vi.fn() } })
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(logAudit({ action: "CIN_VERIFIED", userId: "u1" })).resolves.toBeUndefined();

    // Écriture de secours HORS transaction, sans hash/prevHash.
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    const data = auditLogCreate.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("hash");
    expect(data).not.toHaveProperty("prevHash");
    expect(
      errorSpy.mock.calls.some((c) => String(c[0]).includes("audit_chain_contention"))
    ).toBe(true);

    errorSpy.mockRestore();
  });

  it("une erreur inattendue (ex. upsert qui échoue) ne remonte jamais à l'appelant", async () => {
    chainUpsert.mockRejectedValue(new Error("DB down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      logAudit({ action: "ACCOUNT_DELETED", userId: "u1" })
    ).resolves.toBeUndefined();

    expect(
      errorSpy.mock.calls.some((c) => String(c[0]).includes("[AUDIT] write failed"))
    ).toBe(true);

    errorSpy.mockRestore();
  });
});
