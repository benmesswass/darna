/**
 * P2.10 (ROADMAP.md) — loginAction (src/actions/auth.ts) n'avait AUCUNE
 * couverture Vitest : les seuls endroits qui le touchent (tests/components/
 * login-form.test.tsx, tests/api/security-regressions.spec.ts) le mockent ou
 * l'exercent via un vrai serveur (Playwright, hors process Vitest — invisible
 * du coverage v8). @/lib/redirect (safeCallbackUrl/defaultLandingPath) N'EST
 * PAS mocké ici : implémentation réelle, pure, sans dépendance externe.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// next-auth réel tire next/server (résolution intermittente hors alias vitest,
// cf. vitest.config.ts) : mocké comme dans tests/auth-register.test.ts.
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn() } } }));
vi.mock("@/lib/auth", () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: vi.fn().mockResolvedValue(true),
  clientIp: vi.fn().mockResolvedValue("127.0.0.1"),
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    auth: {
      identifiantsInvalides: "Identifiants invalides.",
      captchaEchec: "Vérification anti-robot échouée.",
    },
  }),
}));

import { loginAction } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { verifyTurnstile } from "@/lib/turnstile";
import { AuthError } from "next-auth";

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  (verifyTurnstile as unknown as Mock).mockResolvedValue(true);
  (signIn as unknown as Mock).mockResolvedValue(undefined);
});

describe("loginAction (P2.10)", () => {
  it("rejette des identifiants malformés (zod), sans appeler signIn", async () => {
    const res = await loginAction(undefined, fd({ email: "pas-un-email", password: "x" }));

    expect(res).toEqual({ error: "Identifiants invalides." });
    expect(signIn).not.toHaveBeenCalled();
  });

  it("rejette si le CAPTCHA échoue, sans appeler signIn", async () => {
    (verifyTurnstile as unknown as Mock).mockResolvedValue(false);

    const res = await loginAction(undefined, fd({ email: "a@test.tn", password: "azerty12" }));

    expect(res).toEqual({ error: "Vérification anti-robot échouée." });
    expect(signIn).not.toHaveBeenCalled();
  });

  it("redirige vers /dashboard/verifications si le compte n'est pas encore vérifié", async () => {
    (prisma.user.findUnique as unknown as Mock).mockResolvedValue({
      role: "VOYAGEUR",
      emailVerified: false,
      phoneVerified: true,
      kycStatus: "NON_VERIFIE",
    });

    await loginAction(undefined, fd({ email: "a@test.tn", password: "azerty12" }));

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "a@test.tn",
      password: "azerty12",
      redirectTo: "/dashboard/verifications",
    });
  });

  it("redirige vers / si le compte est déjà entièrement vérifié", async () => {
    (prisma.user.findUnique as unknown as Mock).mockResolvedValue({
      role: "VOYAGEUR",
      emailVerified: true,
      phoneVerified: true,
      kycStatus: "NON_VERIFIE",
    });

    await loginAction(undefined, fd({ email: "a@test.tn", password: "azerty12" }));

    expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ redirectTo: "/" })
    );
  });

  it("retombe sur /dashboard si l'e-mail ne correspond à aucun compte", async () => {
    (prisma.user.findUnique as unknown as Mock).mockResolvedValue(null);

    await loginAction(undefined, fd({ email: "inconnu@test.tn", password: "azerty12" }));

    expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ redirectTo: "/dashboard" })
    );
  });

  it("priorise un callbackUrl interne valide sur la destination par défaut", async () => {
    (prisma.user.findUnique as unknown as Mock).mockResolvedValue({
      role: "VOYAGEUR",
      emailVerified: true,
      phoneVerified: true,
      kycStatus: "NON_VERIFIE",
    });

    await loginAction(
      undefined,
      fd({ email: "a@test.tn", password: "azerty12", callbackUrl: "/dashboard/devenir-hote" })
    );

    expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ redirectTo: "/dashboard/devenir-hote" })
    );
    // Aucune lecture DB nécessaire : le callbackUrl explicite court-circuite le calcul.
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("ignore un callbackUrl externe (open redirect) et retombe sur la destination par défaut", async () => {
    (prisma.user.findUnique as unknown as Mock).mockResolvedValue({
      role: "VOYAGEUR",
      emailVerified: true,
      phoneVerified: true,
      kycStatus: "NON_VERIFIE",
    });

    await loginAction(
      undefined,
      fd({ email: "a@test.tn", password: "azerty12", callbackUrl: "https://evil.com" })
    );

    expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ redirectTo: "/" })
    );
  });

  it("renvoie un message générique quand signIn lève une AuthError (identifiants incorrects)", async () => {
    (prisma.user.findUnique as unknown as Mock).mockResolvedValue(null);
    (signIn as unknown as Mock).mockRejectedValue(new AuthError("CredentialsSignin"));

    const res = await loginAction(undefined, fd({ email: "a@test.tn", password: "azerty12" }));

    expect(res).toEqual({ error: "Identifiants invalides." });
  });

  it("laisse passer une erreur NON-AuthError (redirection interne NextAuth)", async () => {
    (prisma.user.findUnique as unknown as Mock).mockResolvedValue(null);
    const redirectSignal = new Error("NEXT_REDIRECT");
    (signIn as unknown as Mock).mockRejectedValue(redirectSignal);

    await expect(
      loginAction(undefined, fd({ email: "a@test.tn", password: "azerty12" }))
    ).rejects.toBe(redirectSignal);
  });
});
