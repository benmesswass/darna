import type { ErrorEvent } from "@sentry/core";

/**
 * Scrubber PII partagé (LANCEMENT_ROADMAP.md §L4.2) — jamais de CIN, e-mail ou
 * téléphone envoyé à Sentry, dans les breadcrumbs comme dans le
 * message/exception principal. Utilisé comme `beforeSend` par les 3 init
 * (server/edge/client) pour une politique cohérente.
 *
 * Best-effort par expression régulière (pas un DLP exhaustif) : couvre le cas
 * courant (une donnée sensible qui transite dans un message d'erreur ou un
 * breadcrumb applicatif), pas une garantie absolue contre toute fuite dans une
 * stacktrace ou une variable arbitraire.
 */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Numéro tunisien (8 chiffres, ± indicatif +216) ou international générique
// (8 chiffres ou plus, séparateurs courants) — volontairement large plutôt
// que de rater un format.
const PHONE_RE = /\+?\d[\d\s().-]{6,}\d/g;
// CIN tunisienne : exactement 8 chiffres. Isolé par \b pour ne pas mordre sur
// un nombre plus long (déjà couvert par PHONE_RE de toute façon). NB : un
// nombre de 8 chiffres nus (sans séparateur) matche AUSSI PHONE_RE (appliqué
// avant) — la valeur est donc masquée par le motif téléphone dans ce cas, pas
// celui-ci. Sans incidence sur l'objectif (la valeur brute disparaît toujours) ;
// seul le libellé exact du masque n'est pas garanti pour ce cas précis.
const CIN_RE = /\b\d{8}\b/g;

function redact(value: string): string {
  return value
    .replace(EMAIL_RE, "[email masqué]")
    .replace(PHONE_RE, "[téléphone masqué]")
    .replace(CIN_RE, "[CIN masqué]");
}

function scrubData(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = typeof value === "string" ? redact(value) : value;
  }
  return out;
}

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.message) event.message = redact(event.message);

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => ({
      ...crumb,
      message: crumb.message ? redact(crumb.message) : crumb.message,
      data: crumb.data ? scrubData(crumb.data) : crumb.data,
    }));
  }

  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((exc) => ({
      ...exc,
      value: exc.value ? redact(exc.value) : exc.value,
    }));
  }

  // L'identifiant interne (event.user.id) suffit à corréler les events d'un
  // même utilisateur — jamais son e-mail ni son IP dans Sentry.
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
  }

  if (event.request) {
    delete event.request.cookies;
    if (event.request.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
  }

  return event;
}
