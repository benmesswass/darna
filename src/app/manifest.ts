import type { MetadataRoute } from "next";
import { fr } from "@/lib/i18n/fr";

/**
 * PWA minimale (LANCEMENT_ROADMAP.md §L9.2) : manifest servi automatiquement
 * par la convention App Router à `/manifest.webmanifest`, avec le `<link
 * rel="manifest">` injecté dans `<head>` sans configuration supplémentaire.
 * Métadonnées en français canonique (même choix que `metadata` dans
 * layout.tsx) : le manifest est global, pas localisé par requête.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${fr.meta.siteName} — ${fr.meta.tagline}`,
    short_name: fr.meta.siteName,
    description: fr.meta.description,
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f1",
    theme_color: "#e3a93c",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
