import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Tests unitaires des chemins critiques (paiement, booking, rate limiting).
 * Environnement `node` (modules serveur) ; on réutilise l'alias `@/` du tsconfig.
 * Les tests vivent dans `tests/` (hors `src/`) pour ne jamais être pris pour
 * des routes par Next ni embarqués dans le bundle de prod.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
