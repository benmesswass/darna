"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker (LANCEMENT_ROADMAP.md §L9.2, `public/sw.js`).
 * Production uniquement : en dev, le cache-first sur `/_next/static` gênerait
 * le hot-reload (chunks recompilés à la même URL de session en session).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Best-effort : l'app fonctionne à l'identique sans SW (pas de mode offline).
    });
  }, []);

  return null;
}
