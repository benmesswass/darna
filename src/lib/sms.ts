import { logStructured } from "@/lib/audit";

/**
 * Abstraction d'envoi de SMS — seam pour le provider réel (Twilio, passerelle
 * tunisienne…), à brancher en prod via env. Conforme à `CLAUDE.md` (« zéro
 * service payant obligatoire ») : aucun provider configuré ⇒ **mode dev**, on
 * journalise sans rien envoyer et on renvoie `false`. L'appelant affiche alors
 * le code à l'écran (comportement démo).
 *
 * Module SERVEUR uniquement.
 *
 * @returns `true` si délégué à un provider réel, `false` en mode dev.
 */
export async function sendSms(phone: string, message: string): Promise<boolean> {
  // TODO prod : brancher ici le provider (signé par env), puis renvoyer true.
  // On journalise la longueur, jamais le contenu (le code OTP ne fuite pas).
  logStructured("info", "sms.dev_noop", { phone: maskPhone(phone), chars: message.length });
  return false;
}

/** Masque le numéro dans les logs (ne jamais journaliser un numéro en clair). */
function maskPhone(phone: string): string {
  return phone.replace(/\d(?=\d{2})/g, "•");
}
