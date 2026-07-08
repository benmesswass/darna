/**
 * Setup du projet de test `jsdom` (composants React, Phase 2).
 * - Ajoute les matchers @testing-library/jest-dom (`toBeInTheDocument`, …).
 * - Nettoie le DOM monté entre chaque test (évite les fuites entre cas).
 */
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
