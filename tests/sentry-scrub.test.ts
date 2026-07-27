/**
 * LANCEMENT_ROADMAP.md §L4.2 — scrubber `beforeSend` : jamais de CIN/e-mail/
 * téléphone envoyé à Sentry, dans les breadcrumbs comme dans le
 * message/exception principal ni dans l'utilisateur/la requête.
 */
import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/core";
import { scrubSentryEvent } from "@/lib/sentry-scrub";

// Fixtures de test volontairement partielles — cast plutôt que de satisfaire
// la forme exacte (et peu ergonomique : `type: undefined` obligatoire) de
// ErrorEvent à chaque cas.
function errorEvent(partial: Partial<ErrorEvent>): ErrorEvent {
  return partial as ErrorEvent;
}

describe("scrubSentryEvent", () => {
  it("masque un e-mail dans le message principal", () => {
    const event = scrubSentryEvent(errorEvent({ message: "Échec pour wassim@example.com" }));
    expect(event.message).toBe("Échec pour [email masqué]");
  });

  it("masque un numéro de téléphone dans un breadcrumb", () => {
    const event = scrubSentryEvent(
      errorEvent({ breadcrumbs: [{ message: "Appel de +216 20 123 456", category: "app" }] })
    );
    expect(event.breadcrumbs?.[0].message).toBe("Appel de [téléphone masqué]");
  });

  it("masque une CIN (8 chiffres) dans les données d'un breadcrumb — la valeur brute ne doit jamais apparaître", () => {
    const event = scrubSentryEvent(
      errorEvent({ breadcrumbs: [{ data: { cin: "12345678", other: 42 } }] })
    );
    // Le motif CIN (8 chiffres nus) chevauche le motif téléphone (large par
    // design, cf. commentaire de PHONE_RE) : le libellé exact du masque n'est
    // pas garanti, seule l'absence totale de la valeur brute compte ici.
    expect(event.breadcrumbs?.[0].data?.cin).not.toBe("12345678");
    expect(String(event.breadcrumbs?.[0].data?.cin)).toMatch(/masqué/);
    expect(event.breadcrumbs?.[0].data?.other).toBe(42);
  });

  it("masque un e-mail dans la valeur d'une exception", () => {
    const event = scrubSentryEvent(
      errorEvent({ exception: { values: [{ type: "Error", value: "user not-found@x.tn" }] } })
    );
    expect(event.exception?.values?.[0].value).toBe("user [email masqué]");
  });

  it("retire l'e-mail et l'IP de l'utilisateur, garde l'id", () => {
    const event = scrubSentryEvent(
      errorEvent({ user: { id: "u1", email: "a@b.com", ip_address: "1.2.3.4" } })
    );
    expect(event.user).toEqual({ id: "u1" });
  });

  it("retire les cookies et les en-têtes sensibles de la requête", () => {
    const event = scrubSentryEvent(
      errorEvent({
        request: {
          url: "/dashboard",
          cookies: { session: "abc" },
          headers: { authorization: "Bearer x", cookie: "session=abc", "user-agent": "test" },
        },
      })
    );
    expect(event.request?.cookies).toBeUndefined();
    expect(event.request?.headers).toEqual({ "user-agent": "test" });
  });

  it("laisse un event sans donnée sensible inchangé", () => {
    const event = scrubSentryEvent(errorEvent({ message: "Erreur générique", level: "error" }));
    expect(event).toEqual({ message: "Erreur générique", level: "error" });
  });
});
