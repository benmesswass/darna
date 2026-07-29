import { test, expect } from "@playwright/test";
import { safeCallbackUrl } from "@/lib/redirect";
import { searchAddressAction } from "@/actions/geocode";
import { initKonnectPayment } from "@/lib/konnect";
import { sendEmail } from "@/lib/mailer";
import { sendMetaWhatsApp } from "@/lib/otp-channel";

/**
 * Régressions sécurité figées (TEST_AUTOMATION_ROADMAP.md Phase 4). Chaque
 * protection existe déjà — le but est de la figer, pas de corriger un bug.
 *
 * Open-redirect et SSRF ciblent des fonctions pures/server actions, pas des
 * routes `api/**` — les invoquer directement (import direct, même esprit que
 * tests/konnect.test.ts) est plus robuste qu'une invocation HTTP brute d'une
 * Server Action (RPC interne à hash d'id non stable, pas une API à contrat).
 *
 * L'énumération (anti-énumération login) est déjà couverte par
 * tests/e2e/01-auth.spec.ts au niveau UI réel — pas dupliquée ici : le
 * chemin passe par un Server Action (loginAction), pas une route `api/**`,
 * et une session de test nécessiterait de fabriquer un JWT NextAuth à la
 * main (hors scope de ce premier lot ; à ajouter si un besoin plus poussé
 * d'énumération HTTP apparaît).
 */

test.describe("Open-redirect — safeCallbackUrl", () => {
  test("rejette les URLs absolues", () => {
    expect(safeCallbackUrl("https://evil.com", "/dashboard")).toBe("/dashboard");
    expect(safeCallbackUrl("http://evil.com/phish", "/dashboard")).toBe("/dashboard");
  });

  test("rejette les URLs protocol-relative (//)", () => {
    expect(safeCallbackUrl("//evil.com", "/dashboard")).toBe("/dashboard");
  });

  test("rejette les chemins commençant par /\\", () => {
    expect(safeCallbackUrl("/\\evil.com", "/dashboard")).toBe("/dashboard");
  });

  test("accepte un chemin interne relatif", () => {
    expect(safeCallbackUrl("/dashboard/reservations", "/dashboard")).toBe("/dashboard/reservations");
  });

  test("retombe sur le fallback si absent", () => {
    expect(safeCallbackUrl(null, "/dashboard")).toBe("/dashboard");
    expect(safeCallbackUrl(undefined, "/dashboard")).toBe("/dashboard");
  });
});

test.describe("SSRF geocode — searchAddressAction", () => {
  test("l'hôte de sortie reste photon.komoot.io quel que soit l'input", async () => {
    const originalFetch = global.fetch;
    let capturedUrl: string | undefined;
    global.fetch = (async (input: RequestInfo | URL) => {
      capturedUrl = typeof input === "string" ? input : input.toString();
      return new Response(JSON.stringify({ features: [] }), { status: 200 });
    }) as typeof fetch;

    try {
      const maliciousInputs = [
        "http://169.254.169.254/latest/meta-data/",
        "@evil.com",
        "127.0.0.1:22",
        "test#@internal-service",
      ];
      for (const query of maliciousInputs) {
        capturedUrl = undefined;
        await searchAddressAction(query);
        expect(capturedUrl, `query="${query}"`).toBeDefined();
        expect(new URL(capturedUrl!).host, `query="${query}"`).toBe("photon.komoot.io");
      }
    } finally {
      global.fetch = originalFetch;
    }
  });
});

test.describe("SSRF Konnect — initKonnectPayment", () => {
  test("l'hôte de sortie reste celui de KONNECT_API_URL, jamais dérivé des paramètres", async () => {
    const originalFetch = global.fetch;
    let capturedUrl: string | undefined;
    global.fetch = (async (input: RequestInfo | URL) => {
      capturedUrl = typeof input === "string" ? input : input.toString();
      return new Response(
        JSON.stringify({ payUrl: "https://pay.example/x", paymentRef: "ref-1" }),
        { status: 200 }
      );
    }) as typeof fetch;

    try {
      // orderId/description/email : des champs texte libres jamais utilisés
      // pour construire l'URL de requête (seul KONNECT_API_URL l'est) — on
      // vérifie qu'une valeur hostile n'a aucune influence sur l'hôte réel.
      await initKonnectPayment({
        amountTND: 10,
        orderId: "@evil.com",
        description: "http://169.254.169.254/latest/meta-data/",
        webhook: "https://darna.tn/api/payments/konnect/webhook",
        successUrl: "https://darna.tn/success",
        failUrl: "https://darna.tn/fail",
        lifespanMinutes: 15,
        email: "t@t.com",
      });
      expect(capturedUrl).toBeDefined();
      const expectedHost = new URL(
        process.env.KONNECT_API_URL ?? "https://api.sandbox.konnect.network/api/v2"
      ).host;
      expect(new URL(capturedUrl!).host).toBe(expectedHost);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

test.describe("SSRF Resend — sendEmail", () => {
  test("l'hôte de sortie reste api.resend.com quel que soit le contenu", async () => {
    const originalFetch = global.fetch;
    const originalProvider = process.env.EMAIL_PROVIDER;
    const originalKey = process.env.RESEND_API_KEY;
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "test-key-not-real";

    let capturedUrl: string | undefined;
    global.fetch = (async (input: RequestInfo | URL) => {
      capturedUrl = typeof input === "string" ? input : input.toString();
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    try {
      await sendEmail({
        to: "victim@darna.tn",
        subject: "http://169.254.169.254/ SSRF via subject",
        html: "<script>@evil.com</script>",
      });
      expect(capturedUrl).toBeDefined();
      expect(new URL(capturedUrl!).host).toBe("api.resend.com");
    } finally {
      global.fetch = originalFetch;
      if (originalProvider === undefined) delete process.env.EMAIL_PROVIDER;
      else process.env.EMAIL_PROVIDER = originalProvider;
      if (originalKey === undefined) delete process.env.RESEND_API_KEY;
      else process.env.RESEND_API_KEY = originalKey;
    }
  });
});

test.describe("SSRF Meta WhatsApp — sendMetaWhatsApp", () => {
  test("l'hôte de sortie reste graph.facebook.com quel que soit le contenu", async () => {
    const originalFetch = global.fetch;
    const originalToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
    const originalPhoneId = process.env.META_WHATSAPP_PHONE_ID;
    process.env.META_WHATSAPP_ACCESS_TOKEN = "test-token-not-real";
    process.env.META_WHATSAPP_PHONE_ID = "@evil.com";

    let capturedUrl: string | undefined;
    global.fetch = (async (input: RequestInfo | URL) => {
      capturedUrl = typeof input === "string" ? input : input.toString();
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    try {
      // META_WHATSAPP_PHONE_ID ci-dessus est hostile à dessein : seul le PATH
      // de la requête l'utilise (jamais l'hôte) — on vérifie que ça reste vrai.
      await sendMetaWhatsApp("+21622345678", "123456");
      expect(capturedUrl).toBeDefined();
      expect(new URL(capturedUrl!).host).toBe("graph.facebook.com");
    } finally {
      global.fetch = originalFetch;
      if (originalToken === undefined) delete process.env.META_WHATSAPP_ACCESS_TOKEN;
      else process.env.META_WHATSAPP_ACCESS_TOKEN = originalToken;
      if (originalPhoneId === undefined) delete process.env.META_WHATSAPP_PHONE_ID;
      else process.env.META_WHATSAPP_PHONE_ID = originalPhoneId;
    }
  });
});

test.describe("CSRF — protection same-origin native des Server Actions", () => {
  test("une origine différente du host est rejetée", async ({ request }) => {
    // Next.js compare Origin/Host pour toute requête portant l'en-tête
    // `Next-Action` (invocation de Server Action), avant même de résoudre
    // quelle action cibler — testable sans connaître un id d'action valide.
    const res = await request.post("/connexion", {
      headers: {
        Origin: "https://evil.com",
        "Next-Action": "0000000000000000000000000000000000000000",
      },
      form: {},
      failOnStatusCode: false,
    });
    expect(res.status(), "une origine étrangère ne doit jamais aboutir en 200").not.toBe(200);
  });
});
