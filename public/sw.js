// PWA minimale (LANCEMENT_ROADMAP.md §L9.2) : cache-first UNIQUEMENT sur les
// assets statiques versionnés (JS/CSS hashés par build + icônes), tout le
// reste (pages, /api, server actions) passe en réseau direct — pas de
// fallback offline, pas de cache sur /api ni les server actions (POST).
// Bump CACHE_NAME à chaque changement de logique de cache pour purger
// l'ancien contenu (cf. `activate`) — pas besoin de le bump pour un déploiement
// normal, les URLs /_next/static/* changent déjà de hash.
const CACHE_NAME = "darna-static-v1";

const CACHEABLE_PATHS = [/^\/_next\/static\//, /^\/icons\//];

function isCacheable(url) {
  return CACHEABLE_PATHS.some((re) => re.test(url.pathname));
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Jamais /api ni les server actions (POST) : uniquement les GET sur des
  // chemins d'assets statiques passent par le cache.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !isCacheable(url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
  );
});
