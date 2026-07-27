/**
 * LANCEMENT_ROADMAP.md §L4.3 — détection de spike d'échecs de connexion :
 * compteur global (rate-limit lib), alerte observabilité une seule fois par
 * fenêtre (au franchissement du seuil), pas à chaque échec suivant.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/audit", () => ({ logStructured: vi.fn() }));
vi.mock("@/lib/observability", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ incrementWindowedCounter: vi.fn() }));

import { trackLoginFailure } from "@/lib/login-failure-tracking";
import { captureError } from "@/lib/observability";
import { incrementWindowedCounter } from "@/lib/rate-limit";
import { LOGIN_FAILURE_SPIKE_THRESHOLD, LOGIN_FAILURE_SPIKE_WINDOW_MINUTES } from "@/lib/config";

const captureErrorMock = captureError as unknown as Mock;
const incrementMock = incrementWindowedCounter as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("trackLoginFailure", () => {
  it("incrémente le compteur global, sans alerter tant que le seuil n'est pas atteint", async () => {
    incrementMock.mockResolvedValue(3);

    await trackLoginFailure({ reason: "invalid_password", userId: "u1" });

    expect(incrementMock).toHaveBeenCalledWith(
      "global-login-failures",
      LOGIN_FAILURE_SPIKE_WINDOW_MINUTES * 60 * 1000
    );
    expect(captureErrorMock).not.toHaveBeenCalled();
  });

  it("alerte l'observabilité UNE FOIS quand le compteur atteint exactement le seuil", async () => {
    incrementMock.mockResolvedValue(LOGIN_FAILURE_SPIKE_THRESHOLD);

    await trackLoginFailure({ reason: "user_not_found", email: "x@y.com" });

    expect(captureErrorMock).toHaveBeenCalledTimes(1);
    expect(captureErrorMock).toHaveBeenCalledWith(expect.any(Error), {
      count: LOGIN_FAILURE_SPIKE_THRESHOLD,
      windowMinutes: LOGIN_FAILURE_SPIKE_WINDOW_MINUTES,
    });
  });

  it("n'alerte plus après le seuil (pas de spam à chaque échec suivant)", async () => {
    incrementMock.mockResolvedValue(LOGIN_FAILURE_SPIKE_THRESHOLD + 5);

    await trackLoginFailure({ reason: "invalid_password", userId: "u2" });

    expect(captureErrorMock).not.toHaveBeenCalled();
  });
});
