import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { captureError } from "@/lib/observability";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete process.env.OBSERVABILITY_WEBHOOK_URL;
});

function lastLog(): Record<string, unknown> {
  const calls = vi.mocked(console.error).mock.calls;
  return JSON.parse(String(calls[calls.length - 1][0]));
}

describe("captureError", () => {
  it("logge toujours l'erreur en JSON structuré, sans POST si pas d'URL", async () => {
    delete process.env.OBSERVABILITY_WEBHOOK_URL;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await captureError(new Error("boom"), { path: "/x" });

    expect(lastLog()).toMatchObject({
      level: "error",
      event: "app.exception",
      message: "boom",
      path: "/x",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("POST vers le webhook si OBSERVABILITY_WEBHOOK_URL est défini", async () => {
    process.env.OBSERVABILITY_WEBHOOK_URL = "https://sink.example/err";
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    await captureError(new Error("kaboom"));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://sink.example/err");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body).message).toBe("kaboom");
  });

  it("n'échoue jamais si le POST rejette", async () => {
    process.env.OBSERVABILITY_WEBHOOK_URL = "https://sink.example/err";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    await expect(captureError(new Error("x"))).resolves.toBeUndefined();
  });

  it("normalise une valeur non-Error en message", async () => {
    delete process.env.OBSERVABILITY_WEBHOOK_URL;
    vi.stubGlobal("fetch", vi.fn());

    await captureError("just a string");

    expect(lastLog().message).toBe("just a string");
  });
});
