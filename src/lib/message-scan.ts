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

// Suite d'au moins 8 chiffres, éventuellement séparés par espaces, points,
// tirets, parenthèses ou préfixée d'un « + » : couvre les numéros tunisiens
// (8 chiffres) comme internationaux (+216 …). Les nombres plus courts (prix
// courts, années, « 2 voyageurs ») ne sont pas touchés.
const PHONE_RE = /\+?\d(?:[\s.\-()]*\d){7,}/g;

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
 * Masque les coordonnées d'un message (e-mails, numéros, apps de
 * contournement) et signale (`flagged`) tout masquage OU toute sollicitation
 * de contact hors plateforme (fr/derja/arabizi). `clean` = corps assaini.
 */
export function scanForContactInfo(body: string): { clean: string; flagged: boolean } {
  let flagged = false;
  const mask = () => {
    flagged = true;
    return CONTACT_MASK;
  };

  // Ordre : e-mails d'abord (leur partie chiffrée ne doit pas être prise pour
  // un numéro), puis numéros, puis apps.
  const clean = body
    .replace(EMAIL_RE, mask)
    .replace(PHONE_RE, mask)
    .replace(APP_RE, mask);

  // Sollicitations : flag seul (pas de masquage), évalué sur le texte d'origine.
  if (SOLICIT_RE.test(body)) flagged = true;

  return { clean, flagged };
}
