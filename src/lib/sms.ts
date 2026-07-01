import { logStructured } from "@/lib/audit";
import { kycMode } from "@/lib/modes";

/**
 * Abstraction d'envoi de SMS — seam pour le provider réel (Twilio, passerelle
 * tunisienne…). Aiguillé par KYC_MODE (cf. src/lib/modes.ts) :
 *
 *  • **démo** (défaut) : aucun envoi, on journalise et on renvoie `false` →
 *    l'appelant affiche le code à l'écran (comportement démo conservé).
 *  • **production** : un provider réel DOIT être branché ci-dessous (SMS_PROVIDER
 *    est validé au boot par env.ts). Tant qu'aucun provider n'est implémenté, on
 *    ÉCHOUE bruyamment plutôt que de dégrader en démo — garantie qu'aucun code
 *    OTP ne peut jamais fuiter au client en production.
 *
 * Module SERVEUR uniquement.
 *
 * @returns `true` si délégué à un provider réel (jamais `false` en production).
 */
export async function sendSms(phone: string, message: string): Promise<boolean> {
  if (kycMode() !== "production") {
    // Mode démo : on journalise la longueur, jamais le contenu (pas de fuite).
    logStructured("info", "sms.dev_noop", { phone: maskPhone(phone), chars: message.length });
    return false;
  }

  // Mode production — appel réel au provider configuré (`SMS_PROVIDER`).
  // Aucun fallback démo possible : on lève pour ne JAMAIS exposer le code.
  switch (process.env.SMS_PROVIDER) {
    case "twilio":
      return sendTwilioSms(phone, message);
    default:
      logStructured("error", "sms.provider_not_implemented", {
        phone: maskPhone(phone),
        provider: process.env.SMS_PROVIDER ?? null,
      });
      throw new Error(
        `Provider SMS « ${process.env.SMS_PROVIDER ?? "?"} » non implémenté — brancher l'envoi réel dans src/lib/sms.ts avant KYC_MODE=production.`
      );
  }
}

/**
 * Envoi SMS réel via l'API Twilio (Messages REST). Identifiants lus côté serveur
 * uniquement (jamais `NEXT_PUBLIC_`) — leur présence est garantie au boot par
 * src/lib/env.ts dès `SMS_PROVIDER=twilio`. `TWILIO_FROM` accepte un numéro
 * expéditeur (E.164) OU un Messaging Service SID (préfixe `MG…`) : on aiguille
 * vers le bon paramètre d'API. Lève en cas d'échec réseau/HTTP → l'appelant
 * (ex. repli WhatsApp→SMS dans otp-channel.ts) traite l'erreur.
 *
 * Module SERVEUR uniquement.
 */
async function sendTwilioSms(phone: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM!;

  const params = new URLSearchParams({ To: phone, Body: message });
  // Un Messaging Service (SID `MG…`) se passe en `MessagingServiceSid`, un numéro
  // brut en `From` — Twilio rejette le mauvais champ.
  if (from.startsWith("MG")) {
    params.set("MessagingServiceSid", from);
  } else {
    params.set("From", from);
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    }
  );

  if (!res.ok) {
    const body = await res.text();
    logStructured("error", "sms.twilio_send_failed", {
      phone: maskPhone(phone),
      status: res.status,
      body,
    });
    throw new Error(`Twilio API error ${res.status}: ${body}`);
  }

  logStructured("info", "sms.twilio_sent", { phone: maskPhone(phone) });
  return true;
}

/** Masque le numéro dans les logs (ne jamais journaliser un numéro en clair). */
function maskPhone(phone: string): string {
  return phone.replace(/\d(?=\d{2})/g, "•");
}
