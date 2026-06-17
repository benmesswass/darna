import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { booking: { updateMany: vi.fn() } },
}));
vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));

import { completeElapsedBookings } from "@/lib/bookings";
import { prisma } from "@/lib/prisma";
import { logStructured } from "@/lib/audit";

const updateMany = prisma.booking.updateMany as unknown as Mock;
const log = logStructured as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("completeElapsedBookings", () => {
  it("clôt les séjours passés (CONFIRMEE→TERMINEE) puis libère le séquestre (EN_SEQUESTRE→LIBERE)", async () => {
    updateMany
      .mockResolvedValueOnce({ count: 2 }) // clôture
      .mockResolvedValueOnce({ count: 2 }); // libération

    await completeElapsedBookings();

    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(updateMany.mock.calls[0][0]).toMatchObject({
      where: { status: "CONFIRMEE" },
      data: { status: "TERMINEE" },
    });
    expect(updateMany.mock.calls[1][0]).toEqual({
      where: { status: "TERMINEE", escrow: "EN_SEQUESTRE" },
      data: { escrow: "LIBERE" },
    });
    expect(log).toHaveBeenCalledWith("info", "escrow.released_batch", { count: 2 });
  });

  it("ne libère QUE le séquestre EN_SEQUESTRE (jamais escrow AUCUN) et ne logue rien si count 0", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await completeElapsedBookings();

    expect(updateMany.mock.calls[1][0].where.escrow).toBe("EN_SEQUESTRE");
    expect(log).not.toHaveBeenCalled();
  });
});
