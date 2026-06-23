/**
 * Tests — sms.ts : aiguillage démo/production + provider Twilio.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendSms } from "@/lib/sms";

describe("sendSms — mode démo", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("ne fait aucun envoi et retourne false (aucun mode réel)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSms("+21622345678", "code 123456");

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("sendSms — production Twilio", () => {
  beforeEach(() => {
    vi.stubEnv("KYC_MODE", "production");
    vi.stubEnv("SMS_PROVIDER", "twilio");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC123");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "secret");
    vi.stubEnv("TWILIO_FROM", "+12025550123");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("POST vers l'API Twilio avec Basic auth et retourne true", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSms("+21622345678", "code 123456");

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json");
    expect(opts.method).toBe("POST");
    expect(opts.headers.Authorization).toBe(
      `Basic ${Buffer.from("AC123:secret").toString("base64")}`
    );
    const body = opts.body as URLSearchParams;
    expect(body.get("To")).toBe("+21622345678");
    expect(body.get("Body")).toBe("code 123456");
    expect(body.get("From")).toBe("+12025550123");
    expect(body.get("MessagingServiceSid")).toBeNull();
  });

  it("utilise MessagingServiceSid quand TWILIO_FROM est un SID (MG…)", async () => {
    vi.stubEnv("TWILIO_FROM", "MGabc123");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendSms("+21622345678", "code 123456");

    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("MessagingServiceSid")).toBe("MGabc123");
    expect(body.get("From")).toBeNull();
  });

  it("lève quand l'API Twilio répond en erreur", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 401, text: async () => "unauthorized" });
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendSms("+21622345678", "code 123456")).rejects.toThrow(/Twilio API error 401/);
  });
});

describe("sendSms — production sans provider câblé", () => {
  beforeEach(() => {
    vi.stubEnv("KYC_MODE", "production");
    vi.stubEnv("SMS_PROVIDER", "passerelle-inconnue");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("lève (jamais de dégradation démo qui exposerait le code)", async () => {
    await expect(sendSms("+21622345678", "code 123456")).rejects.toThrow(/non implémenté/);
  });
});
