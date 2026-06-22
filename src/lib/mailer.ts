/**
 * PR5 — Abstraction d'envoi d'e-mail pour la vérification e-mail.
 * Provider aiguillé par EMAIL_PROVIDER :
 *  • absent / `demo` (défaut) : aucun envoi, journalise et retourne false.
 *  • `resend` : envoi via l'API Resend (RESEND_API_KEY requis).
 *
 * Module SERVEUR uniquement.
 */

import { logStructured } from "@/lib/audit";

export type EmailProvider = "demo" | "resend";

/** Provider e-mail actif (dérivé de EMAIL_PROVIDER). */
export function getEmailProvider(): EmailProvider {
  return process.env.EMAIL_PROVIDER === "resend" ? "resend" : "demo";
}

/** Masque l'adresse e-mail dans les logs. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "•••@•••";
  const masked =
    local.length > 2
      ? local[0] + "•".repeat(local.length - 2) + local[local.length - 1]
      : "••";
  return `${masked}@${domain}`;
}

/**
 * Construit les en-têtes HTTP pour l'API Resend.
 * Exporté comme fonction pure pour les tests.
 */
export function buildAuthHeader(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

/**
 * Construit le payload JSON pour l'API Resend.
 * Exporté comme fonction pure pour les tests.
 */
export function buildResendPayload(params: {
  to: string;
  subject: string;
  html: string;
}): Record<string, unknown> {
  return {
    from: process.env.EMAIL_FROM ?? "Darna <noreply@darna.tn>",
    to: [params.to],
    subject: params.subject,
    html: params.html,
  };
}

/**
 * Envoie un e-mail.
 * @returns `true` si délégué à un provider réel ; `false` en mode démo.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const provider = getEmailProvider();

  if (provider !== "resend") {
    logStructured("info", "email.dev_noop", {
      to: maskEmail(params.to),
      subject: params.subject,
    });
    return false;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logStructured("error", "email.resend_key_missing", { to: maskEmail(params.to) });
    throw new Error(
      "EMAIL_PROVIDER=resend mais RESEND_API_KEY est absent — configurer la clé Resend."
    );
  }

  const url = "https://api.resend.com/emails";
  const payload = buildResendPayload(params);
  const headers = buildAuthHeader(apiKey);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      logStructured("error", "email.send_failed", { status: res.status, body: text });
      throw new Error(`Resend API error ${res.status}: ${text}`);
    }

    return true;
  } catch (err) {
    logStructured("error", "email.send_error", {
      to: maskEmail(params.to),
      error: String(err),
    });
    throw err;
  }
}
