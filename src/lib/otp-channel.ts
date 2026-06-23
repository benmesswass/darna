/**
 * PR4 — Abstraction multi-canal OTP : SMS (défaut) ou WhatsApp Business API (Meta).
 * Aiguillé par OTP_PROVIDER (cf. src/lib/modes.ts) :
 *
 *  • `sms` (défaut) : délègue à src/lib/sms.ts (comportement historique).
 *  • `meta-whatsapp` : envoie via WhatsApp Cloud API. Token + phone id requis,
 *    sous les noms historiques (META_WHATSAPP_ACCESS_TOKEN / META_WHATSAPP_PHONE_ID)
 *    ou les alias de la checklist Meta (META_WABA_TOKEN / META_WABA_PHONE_NUMBER_ID).
 *    Template configurable via META_WA_TEMPLATE_NAME / META_WA_TEMPLATE_LANG.
 *    Version d'API via META_GRAPH_API_VERSION (défaut v21.0). Le numéro est
 *    normalisé (toWhatsAppNumber) avant l'appel.
 *
 * Module SERVEUR uniquement.
 */

import { logStructured } from "@/lib/audit";
import { getOtpProvider } from "@/lib/modes";
import { sendSms } from "@/lib/sms";

export type OtpChannel = "sms" | "meta-whatsapp";

/** Version de l'API Graph (override possible via META_GRAPH_API_VERSION). */
const DEFAULT_GRAPH_API_VERSION = "v21.0";

/**
 * Normalise un numéro au format attendu par WhatsApp Cloud API :
 * indicatif pays + numéro, SANS « + », espaces, tirets ni préfixe « 00 ».
 * Ex. : "+216 22 345 678" → "21622345678" ; "0033650031666" → "33650031666".
 * Exporté comme fonction pure pour les tests.
 */
export function toWhatsAppNumber(phone: string): string {
  const compact = phone.replace(/[^\d+]/g, ""); // garde chiffres et un éventuel +
  return compact.replace(/^\+/, "").replace(/^00/, "");
}

/**
 * Compose un numéro E.164 (`+<indicatif><national>`) à partir d'un indicatif
 * pays et d'un numéro national saisi par l'utilisateur. Retire les espaces et
 * le(s) « 0 » de tête du national (format local) — ce qui lève l'ambiguïté
 * qu'un simple numéro national ne permettait pas de résoudre.
 * Ex. : ("33", "06 50 03 16 66") → "+33650031666".
 * Exporté comme fonction pure pour les tests.
 */
export function composeE164(countryCode: string, national: string): string {
  const cc = countryCode.replace(/\D/g, "");
  const nat = national.replace(/\D/g, "").replace(/^0+/, "");
  return `+${cc}${nat}`;
}

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
 * `templateName` / `templateLang` sont configurables (défauts : "authentication"
 * / "fr") via META_WA_TEMPLATE_NAME / META_WA_TEMPLATE_LANG.
 * Exporté comme fonction pure pour les tests.
 */
export function buildMetaTemplateBody(
  to: string,
  code: string,
  templateName = "authentication",
  templateLang = "fr"
): Record<string, unknown> {
  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
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

/** Corps du SMS d'OTP (factorisé : canal SMS direct ET repli WhatsApp→SMS). */
function otpSmsText(code: string): string {
  return `Darna : votre code de vérification est ${code}`;
}

/**
 * Envoie le code OTP via le canal configuré (SMS ou WhatsApp).
 *
 * Repli automatique WhatsApp→SMS : si le canal actif est WhatsApp et que
 * l'envoi lève une erreur RÉELLE (clé Meta présente + API qui plante), on
 * bascule sur le SMS pour ne pas bloquer la vérification. Le no-op démo
 * (`sendMetaWhatsApp` retourne `false` sans erreur quand aucune clé n'est
 * configurée) ne passe PAS par ce repli : il garde son comportement historique
 * (affichage du code à l'écran par l'appelant).
 *
 * @returns `true` si délégué à un provider réel (jamais `false` en production).
 */
export async function sendOtp(phone: string, code: string): Promise<boolean> {
  const provider = getOtpProvider();

  if (provider === "meta-whatsapp") {
    try {
      return await sendMetaWhatsApp(phone, code);
    } catch (err) {
      // Échec réel d'envoi WhatsApp : repli SMS automatique.
      logStructured("warn", "otp.whatsapp_fallback_sms", {
        phone: phone.replace(/\d(?=\d{2})/g, "•"),
        error: String(err),
      });
      return sendSms(phone, otpSmsText(code));
    }
  }

  // Défaut : SMS (comportement historique)
  return sendSms(phone, otpSmsText(code));
}

/**
 * Envoi WhatsApp via Meta Cloud API. En mode démo (META_WHATSAPP_ACCESS_TOKEN
 * absent), journalise et retourne false → l'appelant affiche le code à l'écran.
 */
export async function sendMetaWhatsApp(phone: string, code: string): Promise<boolean> {
  // Deux jeux de noms acceptés : historiques (META_WHATSAPP_*) et alias
  // documentés dans la checklist Meta (META_WABA_*).
  const accessToken =
    process.env.META_WHATSAPP_ACCESS_TOKEN || process.env.META_WABA_TOKEN;
  const phoneId =
    process.env.META_WHATSAPP_PHONE_ID || process.env.META_WABA_PHONE_NUMBER_ID;

  if (!accessToken || !phoneId) {
    // Mode démo : pas de clé → journalisation sans fuite du code
    logStructured("info", "whatsapp.dev_noop", {
      phone: phone.replace(/\d(?=\d{2})/g, "•"),
      chars: code.length,
    });
    return false;
  }

  const apiVersion = process.env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;
  const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;
  const body = buildMetaTemplateBody(
    toWhatsAppNumber(phone),
    code,
    process.env.META_WA_TEMPLATE_NAME || undefined,
    process.env.META_WA_TEMPLATE_LANG || undefined
  );
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
