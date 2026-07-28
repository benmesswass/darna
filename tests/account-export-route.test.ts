/**
 * LANCEMENT_ROADMAP.md §L7.3 — la route ne fait qu'authentifier + déléguer à
 * buildAccountExport (déjà testée, tests/account-export.test.ts) + auditer.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/account-export", () => ({ buildAccountExport: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));

import { GET } from "@/app/api/account/export/route";
import { getSessionUser } from "@/lib/session";
import { buildAccountExport } from "@/lib/account-export";
import { logAudit } from "@/lib/audit";

const getSessionUserMock = getSessionUser as unknown as Mock;
const buildAccountExportMock = buildAccountExport as unknown as Mock;
const logAuditMock = logAudit as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/account/export", () => {
  it("401 si non connecté — n'appelle jamais buildAccountExport", async () => {
    getSessionUserMock.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(buildAccountExportMock).not.toHaveBeenCalled();
  });

  it("exporte les données du compte CONNECTÉ uniquement (userId vient de la session)", async () => {
    getSessionUserMock.mockResolvedValue({ id: "user-1", role: "VOYAGEUR" });
    buildAccountExportMock.mockResolvedValue({ exportedAt: "2026-07-28T00:00:00.000Z", profil: {} });

    const res = await GET();
    const body = await res.json();

    expect(buildAccountExportMock).toHaveBeenCalledWith("user-1");
    expect(res.status).toBe(200);
    expect(body.exportedAt).toBe("2026-07-28T00:00:00.000Z");
  });

  it("renvoie un fichier téléchargeable (Content-Disposition attachment)", async () => {
    getSessionUserMock.mockResolvedValue({ id: "user-1", role: "VOYAGEUR" });
    buildAccountExportMock.mockResolvedValue({ exportedAt: "x" });

    const res = await GET();

    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    expect(res.headers.get("Content-Disposition")).toContain("user-1");
  });

  it("journalise ACCOUNT_DATA_EXPORTED avec le bon userId", async () => {
    getSessionUserMock.mockResolvedValue({ id: "user-1", role: "VOYAGEUR" });
    buildAccountExportMock.mockResolvedValue({ exportedAt: "x" });

    await GET();

    expect(logAuditMock).toHaveBeenCalledWith({
      action: "ACCOUNT_DATA_EXPORTED",
      userId: "user-1",
      success: true,
    });
  });
});
