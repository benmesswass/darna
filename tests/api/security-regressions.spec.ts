import { test, expect } from "@playwright/test";
import { safeCallbackUrl } from "@/lib/redirect";
import { searchAddressAction } from "@/actions/geocode";

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
