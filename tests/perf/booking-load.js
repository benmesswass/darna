import http from "k6/http";
import { check } from "k6";

/**
 * TEST_AUTOMATION_ROADMAP.md §6.7 : N `createBookingAction` simultanés sur le
 * MÊME créneau → aucune double-réservation, latence bornée. L'invariant lui-
 * même (SERIALIZABLE tx + overlap check) est déjà prouvé à 2 acteurs par
 * tests/integration/booking-concurrency.integration.test.ts et
 * tests/e2e/03-double-booking.spec.ts — ce script ajoute la dimension
 * CHARGE (N simultanés réels), vérifiée après coup par
 * booking-load-verify.mjs (exactement 1 réservation active en base).
 *
 * Contexte préparé par booking-load-setup.mjs (Prisma + login UI — k6 ne
 * peut faire ni l'un ni l'autre, VM JS isolée sans Node).
 */
const ctx = JSON.parse(open("./.booking-load-context.json"));
const CONCURRENT_REQUESTS = 20;

export const options = {
  scenarios: {
    race: {
      executor: "per-vu-iterations",
      vus: CONCURRENT_REQUESTS,
      iterations: 1,
      maxDuration: "30s",
    },
  },
  thresholds: {
    // Mesuré p95=684ms sur next dev local, 20 VUs (2026-07-09, après le
    // correctif P2034 dans src/actions/bookings.ts — avant, les abandons de
    // transaction Postgres non rattrapés faisaient grimper le p95 à 2.34s).
    // Seuil = mesure + marge, à resserrer contre un vrai build de prod.
    http_req_duration: ["p(95)<1500"],
    checks: ["rate>0.99"],
  },
};

function boundaryBody(boundary) {
  const part = (name, value) =>
    `------${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
  return (
    part("_1_slug", ctx.slug) +
    part("_1_arrivee", ctx.checkIn) +
    part("_1_depart", ctx.checkOut) +
    part("_1_voyageurs", "1") +
    part("_1_paymentMode", "ESCROW") +
    part("0", '["$undefined","$K1"]') +
    `------${boundary}--\r\n`
  );
}

export default function bookingRace() {
  const boundary = `k6Boundary${__VU}${__ITER}`;
  const res = http.post(`${ctx.baseUrl}/annonce/${ctx.slug}/reserver`, boundaryBody(boundary), {
    headers: {
      "next-action": ctx.actionId,
      accept: "text/x-component",
      "content-type": `multipart/form-data; boundary=----${boundary}`,
      cookie: `${ctx.cookieName}=${ctx.cookieValue}`,
    },
  });

  const won = Boolean(res.headers["X-Action-Redirect"]);
  check(res, {
    "réponse serveur valide (200 ou 303)": (r) => r.status === 200 || r.status === 303,
  });
  console.log(`VU ${__VU}: ${won ? "gagné (redirect paiement)" : "perdu/conflit"} — status ${res.status}`);
}
