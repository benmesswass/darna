/**
 * TEST_AUTOMATION_ROADMAP.md §6.7/§8 Phase 5 — charge sur la recherche
 * (`/sejours`), contre un build de PRODUCTION (`next start`, jamais
 * `next dev` — la compilation à la demande fausserait complètement les
 * p95). Nightly/manuel uniquement (job CI `k6`), jamais bloquant sur PR —
 * cf. §7.2 : "k6 charge | Sur PR: — | Nightly: ✅ (ou hebdo)".
 *
 * Portée volontairement limitée au chemin de LECTURE (recherche + fiche
 * annonce). La "fenêtre de course booking" mentionnée dans la roadmap
 * (écriture concurrente, createBookingAction) N'EST PAS incluse ici : c'est
 * une Server Action Next.js, invoquée via un POST sur l'URL de la page avec
 * un header `Next-Action: <hash>` dérivé du build — pas une cible stable pour
 * k6/http (le hash change à chaque build, contrairement à une route API
 * classique). La CORRECTION sous concurrence est déjà prouvée sous vraie
 * transaction SERIALIZABLE par tests/integration/booking-concurrency.
 * integration.test.ts (Phase 1) — ce script caractérise la LATENCE en
 * lecture, pas la correction en écriture. Le volet charge sur la fenêtre de
 * réservation reste un suivi documenté (k6/browser, ou endpoint dédié).
 *
 * La carte (Leaflet, `PropertyMap`/`MapInner`) est du rendu CLIENT — hors de
 * portée d'un outil HTTP comme k6 qui n'exécute pas de JS navigateur.
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.K6_BASE_URL || "http://localhost:3000";

// Villes du focus géo produit (cf. CLAUDE.md — Hammamet/Nabeul/Sousse) +
// une recherche sans filtre (cas le plus fréquent en usage réel).
const SEARCH_QUERIES = [
  "",
  "?ville=Hammamet",
  "?ville=Nabeul",
  "?ville=Sousse&prixMax=300",
  "?voyageurs=4",
];

export const options = {
  scenarios: {
    recherche: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 },
        { duration: "1m", target: 20 },
        { duration: "15s", target: 0 },
      ],
    },
  },
  thresholds: {
    // Cible explicite de la roadmap : p95 < 500 ms sur /sejours.
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function searchLoad() {
  const query = pick(SEARCH_QUERIES);
  const searchRes = http.get(`${BASE_URL}/sejours${query}`, {
    tags: { name: "sejours_search" },
  });
  check(searchRes, {
    "recherche: statut 200": (r) => r.status === 200,
  });

  // Chaîne réaliste recherche -> fiche annonce (une fois sur deux) : extrait
  // un slug réel depuis le HTML retourné plutôt que d'en coder un en dur
  // (robuste à un reseed qui changerait les slugs générés).
  if (Math.random() < 0.5 && searchRes.status === 200) {
    const match = searchRes.body.match(/\/annonce\/([a-z0-9-]+)/);
    if (match) {
      const detailRes = http.get(`${BASE_URL}/annonce/${match[1]}`, {
        tags: { name: "annonce_detail" },
      });
      check(detailRes, {
        "fiche annonce: statut 200": (r) => r.status === 200,
      });
    }
  }

  sleep(1);
}
