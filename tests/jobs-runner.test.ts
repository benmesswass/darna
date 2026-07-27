/**
 * LANCEMENT_ROADMAP.md §L3.1 — socle scheduler : isolation des erreurs par
 * job (un job qui échoue n'empêche pas les autres de tourner), et un seul
 * AuditLog agrégé par tick (pas un par job — éviter l'inflation de la table).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));

import { runJobList, type Job } from "@/lib/jobs/runner";
import { logAudit } from "@/lib/audit";

const logAuditMock = logAudit as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runJobList", () => {
  it("exécute tous les jobs même si l'un d'eux échoue (isolation des erreurs)", async () => {
    const okJob: Job = { name: "ok", run: vi.fn().mockResolvedValue({ count: 3 }) };
    const failingJob: Job = {
      name: "failing",
      run: vi.fn().mockRejectedValue(new Error("boom")),
    };
    const afterFailingJob: Job = { name: "after", run: vi.fn().mockResolvedValue(undefined) };

    const results = await runJobList([okJob, failingJob, afterFailingJob]);

    expect(okJob.run).toHaveBeenCalledTimes(1);
    expect(failingJob.run).toHaveBeenCalledTimes(1);
    expect(afterFailingJob.run).toHaveBeenCalledTimes(1);
    expect(results).toEqual([
      { name: "ok", ok: true, detail: { count: 3 } },
      { name: "failing", ok: false, error: "boom" },
      { name: "after", ok: true, detail: undefined },
    ]);
  });

  it("journalise un seul AuditLog agrégé par tick, avec le résultat de chaque job", async () => {
    const jobA: Job = { name: "a", run: vi.fn().mockResolvedValue(undefined) };
    const jobB: Job = { name: "b", run: vi.fn().mockRejectedValue(new Error("x")) };

    await runJobList([jobA, jobB]);

    expect(logAuditMock).toHaveBeenCalledTimes(1);
    expect(logAuditMock).toHaveBeenCalledWith({
      action: "JOB_TICK",
      metadata: {
        results: [
          { name: "a", ok: true, detail: undefined },
          { name: "b", ok: false, error: "x" },
        ],
      },
    });
  });

  it("est rejouable sans effet caché — deux appels indépendants donnent le même résultat pour les mêmes jobs", async () => {
    const job: Job = { name: "idem", run: vi.fn().mockResolvedValue({ n: 1 }) };

    const first = await runJobList([job]);
    const second = await runJobList([job]);

    expect(first).toEqual(second);
    expect(job.run).toHaveBeenCalledTimes(2);
  });

  it("liste vide → aucun job exécuté, un AuditLog vide quand même journalisé", async () => {
    const results = await runJobList([]);

    expect(results).toEqual([]);
    expect(logAuditMock).toHaveBeenCalledWith({ action: "JOB_TICK", metadata: { results: [] } });
  });

  it("capture une erreur non-Error (throw d'une string) sans planter le tick", async () => {
    const weirdJob: Job = {
      name: "weird",
      run: () => Promise.reject("nope"),
    };

    const results = await runJobList([weirdJob]);

    expect(results).toEqual([{ name: "weird", ok: false, error: "nope" }]);
  });
});
