/**
 * Scan léger des messages de la messagerie interne (Phase 2 anti-bypass).
 *
 * Objectif : empêcher l'échange de coordonnées directes (et donc le passage
 * hors plateforme) AVANT que la réservation soit ferme. On masque à l'écriture
 * les e-mails, les numéros de téléphone et les apps de contournement explicite
 * (WhatsApp, Telegram…). Le résultat `flagged` permet le monitoring.
 *
 * Volontairement PUR (aucune dépendance) → testable et réutilisable côté
 * serveur. On NE masque PAS les mots métier légitimes du modèle Darna (« cash »,
 * « solde à l'arrivée »…) : le règlement en espèces sur place est le cœur du
 * produit, pas un contournement.
 */

/** Remplacement appliqué aux coordonnées détectées. */
export const CONTACT_MASK = "●●●";

// E-mail classique.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Suite d'au moins 7 chiffres, éventuellement séparés par espaces, points,
// tirets, parenthèses ou préfixée d'un « + » : couvre les numéros tunisiens
// (8 chiffres), internationaux (+216 …) et les saisies maladroites (7 chiffres).
// Les nombres plus courts (années, « 2 voyageurs ») ne sont pas touchés.
const PHONE_RE = /\+?\d(?:[\s.\-()]*\d){6,}/g;

// En CONTEXTE de sollicitation (« appelle-moi sur… », « numéro »…), on masque
// aussi les suites COURTES (≥2 chiffres) : c'est la parade au découpage d'un
// numéro sur plusieurs messages (« 222 » puis « 222 » puis « 22 »). Hors
// contexte, on ne touche pas ces nombres courts (risque de masquer un prix).
const PHONE_SHORT_RE = /\d(?:[\s.\-()]*\d){1,}/g;

// Apps de mise en relation hors plateforme (signal explicite de contournement),
// y compris leurs graphies arabizi/abrégées courantes (watsab, tlgrm, vibr…).
const APP_RE =
  /\b(whats?\s?app|wh?atsab|wh?atsap|watsapp|wtsp|wsp|telegram|tlgrm|viber|vibre?|signal|instagram|insta|messenger|messenjer|snapchat|snap|facebook|imo|skype)\b/gi;

/**
 * Sollicitations de contact hors plateforme (fr + derja/arabizi). On NE les
 * masque PAS — elles ne contiennent aucune coordonnée par elles-mêmes et
 * masquer une phrase casserait la conversation — mais on les SIGNALE
 * (`flagged`) pour permettre le monitoring/intervention (cf. Airbnb/Booking).
 * Le payload réel (numéro/e-mail) reste, lui, masqué par EMAIL_RE/PHONE_RE.
 */
const SOLICIT_RE =
  /\b(t[eé]l[eé]?fou?n|t[eé]l[eé]phone|num[eé]ro|numro|nimero|ra9?am|ra9?mi|raqam|raqmi|3ay?tili|3ayetli|kalamni|klamni|sonni|sonnili|appelle|appel|a3tini|a3tik|hatli)\b/i;

/**
 * Masque les coordonnées d'un message et signale les tentatives de bypass.
 * @returns
 *  - `clean`   : corps assaini ;
 *  - `masked`  : une vraie coordonnée (e-mail/numéro/app) a été masquée ;
 *  - `flagged` : `masked` OU une simple sollicitation de contact hors plateforme
 *                a été détectée (fr/derja/arabizi). `flagged` sert au monitoring
 *                admin ; seul `masked` traduit un partage RÉEL de coordonnées.
 */
export function scanForContactInfo(
  body: string,
  opts: { contextSolicited?: boolean } = {}
): {
  clean: string;
  masked: boolean;
  flagged: boolean;
} {
  let masked = false;
  const mask = () => {
    masked = true;
    return CONTACT_MASK;
  };

  // Ordre : e-mails d'abord (leur partie chiffrée ne doit pas être prise pour
  // un numéro), puis numéros, puis apps.
  let clean = body
    .replace(EMAIL_RE, mask)
    .replace(PHONE_RE, mask)
    .replace(APP_RE, mask);

  // Ce message porte-t-il lui-même une sollicitation (« appelle-moi »…) ?
  const ownSolicited = SOLICIT_RE.test(body);

  // En contexte de sollicitation — soit ce message, soit un message RÉCENT du
  // même expéditeur dans le fil (opts.contextSolicited) — on masque aussi les
  // suites courtes de chiffres : parade au numéro découpé sur plusieurs messages.
  if (ownSolicited || opts.contextSolicited) {
    clean = clean.replace(PHONE_SHORT_RE, mask);
  }

  // `flagged` ne dépend QUE de ce message (sollicitation propre ou masquage) :
  // un message anodin après un fil « à risque » n'est pas signalé pour rien.
  return { clean, masked, flagged: masked || ownSolicited };
}
