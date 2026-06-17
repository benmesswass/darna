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

  // Mode production — brancher ici l'appel réel au provider `SMS_PROVIDER` :
  //   switch (process.env.SMS_PROVIDER) { case "twilio": await twilioSend(...); return true; }
  // Aucun fallback démo possible : on lève pour ne JAMAIS exposer le code.
  void message;
  logStructured("error", "sms.provider_not_implemented", {
    phone: maskPhone(phone),
    provider: process.env.SMS_PROVIDER ?? null,
  });
  throw new Error(
    `Provider SMS « ${process.env.SMS_PROVIDER ?? "?"} » non implémenté — brancher l'envoi réel dans src/lib/sms.ts avant KYC_MODE=production.`
  );
}

/** Masque le numéro dans les logs (ne jamais journaliser un numéro en clair). */
function maskPhone(phone: string): string {
  return phone.replace(/\d(?=\d{2})/g, "•");
}
