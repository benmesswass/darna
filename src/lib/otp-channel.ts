/**
 * PR4 — Abstraction multi-canal OTP : SMS (défaut) ou WhatsApp Business API (Meta).
 * Aiguillé par OTP_PROVIDER (cf. src/lib/modes.ts) :
 *
 *  • `sms` (défaut) : délègue à src/lib/sms.ts (comportement historique).
 *  • `meta-whatsapp` : envoie via WhatsApp Cloud API (META_WHATSAPP_PHONE_ID requis).
 *
 * Module SERVEUR uniquement.
 */

import { logStructured } from "@/lib/audit";
import { getOtpProvider } from "@/lib/modes";
import { sendSms } from "@/lib/sms";

export type OtpChannel = "sms" | "meta-whatsapp";

/** Masque l'e-mail dans les logs (ne jamais journaliser en clair). */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "•••@•••";
  const masked = local.length > 2 ? local[0] + "•".repeat(local.length - 2) + local[local.length - 1] : "••";
  return `${masked}@${domain}`;
}

/**
 * Construit les en-têtes HTTP pour l'API WhatsApp Cloud (Meta).
 * Exporté comme fonction pure pour les tests.
 */
export function buildAuthHeader(bearerToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${bearerToken}`,
    "Content-Type": "application/json",
  };
}

/**
 * Construit le corps de la requête d'authentification WhatsApp (template auth).
 * Exporté comme fonction pure pour les tests.
 */
export function buildMetaTemplateBody(to: string, code: string): Record<string, unknown> {
  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: "authentication",
      language: { code: "fr" },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: code }],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: code }],
        },
      ],
    },
  };
}

/**
 * Envoie le code OTP via le canal configuré (SMS ou WhatsApp).
 * @returns `true` si délégué à un provider réel (jamais `false` en production).
 */
export async function sendOtp(phone: string, code: string): Promise<boolean> {
  const provider = getOtpProvider();

  if (provider === "meta-whatsapp") {
    return sendMetaWhatsApp(phone, code);
  }

  // Défaut : SMS (comportement historique)
  return sendSms(phone, `Darna : votre code de vérification est ${code}`);
}

/**
 * Envoi WhatsApp via Meta Cloud API. En mode démo (META_WHATSAPP_ACCESS_TOKEN
 * absent), journalise et retourne false → l'appelant affiche le code à l'écran.
 */
export async function sendMetaWhatsApp(phone: string, code: string): Promise<boolean> {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;

  if (!accessToken || !phoneId) {
    // Mode démo : pas de clé → journalisation sans fuite du code
    logStructured("info", "whatsapp.dev_noop", {
      phone: phone.replace(/\d(?=\d{2})/g, "•"),
      chars: code.length,
    });
    return false;
  }

  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
  const body = buildMetaTemplateBody(phone, code);
  const headers = buildAuthHeader(accessToken);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      logStructured("error", "whatsapp.send_failed", { status: res.status, body: text });
      throw new Error(`WhatsApp API error ${res.status}: ${text}`);
    }

    return true;
  } catch (err) {
    logStructured("error", "whatsapp.send_error", {
      phone: phone.replace(/\d(?=\d{2})/g, "•"),
      error: String(err),
    });
    throw err;
  }
}
