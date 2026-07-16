/**
 * Setup du projet de test `jsdom` (composants React, Phase 2).
 * - Ajoute les matchers @testing-library/jest-dom (`toBeInTheDocument`, …).
 * - Garantit un `localStorage` utilisable (cf. garde ci-dessous).
 * - Nettoie le DOM monté entre chaque test (évite les fuites entre cas).
 */
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Node ≥ 23 (ex. 26) expose un Web Storage natif : `globalThis.localStorage`
 * devient un getter qui, sans le flag `--localstorage-file`, renvoie
 * `undefined` — et comme `window === globalThis` sous jsdom, il OCCULTE le
 * `localStorage` que jsdom fournit. Résultat : tout `window.localStorage.*`
 * (ici `CurrencyProvider`, monté par `renderWithProviders`) plante avec
 * « Cannot read properties of undefined ». La CI tourne sur Node 22 LTS, qui
 * n'expose pas ce natif, donc jsdom reste maître et la suite est verte ; ce
 * garde-fou évite les faux échecs pour un dev sur une version de Node récente.
 * Ne s'active QUE si l'environnement n'expose pas de storage fonctionnel →
 * aucun effet sous Node 22 / en CI.
 */
if (!globalThis.localStorage) {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
});
