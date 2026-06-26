/**
 * Cloudflare Turnstile — CAPTCHA anti-robot des formulaires auth (inscription,
 * connexion).
 *
 * Intégration OPTIONNELLE et à dégradation gracieuse, sur le modèle de Konnect :
 * sans `CAPTCHA_MODE=turnstile`, `isCaptchaEnabled()` renvoie `false` et la
 * vérification laisse tout passer → la démo reste 100 % fonctionnelle sans clé
 * ni friction. Dès que le mode est posé (avec ses deux clés, garanties au boot
 * par src/lib/env.ts), la vérification serveur devient obligatoire.
 *
 * ⚠️  Module SERVEUR uniquement : il lit le secret `TURNSTILE_SECRET_KEY` et ne
 *     doit jamais être importé depuis un composant client. Seule la SITE KEY
 *     (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) est publique — c'est sa nature.
 *
 * Doc : https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

import { captchaMode } from "@/lib/modes";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Vrai si le CAPTCHA réel est ACTIF (cf. src/lib/modes.ts). */
export function isCaptchaEnabled(): boolean {
  return captchaMode() === "turnstile";
}

/** Clé publique du widget, à passer au client. Vide si non configurée. */
export function turnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
}

/**
 * Vérifie un token Turnstile auprès de Cloudflare (source de vérité serveur).
 *
 * - CAPTCHA désactivé → `true` (laisse passer : démo sans friction).
 * - CAPTCHA actif → `true` seulement si Cloudflare confirme le token.
 *
 * Fail-closed : en mode actif, toute config manquante, token absent, erreur
 * réseau ou réponse négative renvoie `false` (on bloque plutôt que d'ouvrir).
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string
): Promise<boolean> {
  if (!isCaptchaEnabled()) return true;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    // L'IP n'est fiable que derrière un proxy de confiance ; sinon on l'omet
    // (Turnstile valide le token sans l'IP).
    if (remoteIp && remoteIp !== "unknown" && remoteIp !== "untrusted") {
      body.set("remoteip", remoteIp);
    }
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
